const createHash = require("crypto")
const url = require("url")
const axios = require("axios").default

class Block {
	private _index
	private _timestamp
	private _transactions
	private _proof
	private _previous_hash
	constructor(index, timestamp, transactions, proof, previous_hash) {
		this._index = index
		this._timestamp = timestamp
		this._transactions = transactions
		this._proof = proof
		this._previous_hash = previous_hash
	}

	get timestamp() {
		return this._timestamp
	}

	get transactions() {
		return this._transactions
	}

	get proof() {
		return this._proof
	}

	get previous_hash() {
		return this._previous_hash
	}

	get index() {
		return this._index
	}
}

class Blockchain {
	private _chain: Array<Block> = []
	private _nodes = new Set()
	private _current_transactions = []
	// Add genesis block

	constructor() {
		this.new_block(100, 1)
	}

	get chain() {
		return this._chain
	}

	get nodes() {
		return this._nodes
	}

	set current_transactions(transactions) {
		this._current_transactions = transactions
	}

	get current_transactions() {
		return this._current_transactions
	}

	public hash(block) {
		let block_string = JSON.stringify(block)
		console.log("Block " + block_string)
		let base64_string = Buffer.from(block_string.toString()).toString("base64")
		let hash = createHash
			.createHash("sha256")
			.update(base64_string)
			.digest("base64")
		console.log("Creating Hash " + hash)
		return hash
	}

	public new_block(proof, previous_hash = null) {
		const that = this
		let previous_index = this.chain.length == 0 ? 0 : this.chain.length - 1

		/*  
            - Important Notice regarding block creation:
            It is important to always use the constructor when creating blocks to ensure consistent hashes.
            If we create the block in a different way, then javascript orders the variables in it in different order
            This creates inconsistent hashes when Object is stringified and hashed since order is altered 
        */

		const time = new Date()

		let block = new Block(
			that.chain.length + 1,
			time,
			that.current_transactions,
			proof,
			previous_hash || this.hash(this.chain[previous_index])
		)
		console.log(block)
		this.current_transactions = []
		this.chain.push(block)
		return block
	}

	public last_block(): Block | number {
		return this.chain.length == 0 ? 0 : this.chain[this.chain.length - 1]
	}

	public new_transaction(sender, recipient, amount) {
		this.current_transactions.push({ sender, recipient, amount })

		return this.chain.length == 0
			? 1
			: this.chain[this.chain.length - 1].index + 1
	}

	public proof_of_work(last_proof) {
		let proof = 0
		while (!this.valid_proof(last_proof, proof)) {
			proof += 1
		}
		console.log("Proof number found " + proof)
		return proof
	}

	public valid_proof(last_proof, proof) {
		let guess =
			Buffer.from(proof.toString().toString("base64")) +
			Buffer.from(last_proof.toString()).toString("base64")
		const hash = createHash.createHash("sha256").update(guess).digest("base64")
		return hash.startsWith("0000")
	}

	public register_node(address) {
		let parsed_url = new URL(address)
		this._nodes.add(parsed_url)
	}

	public valid_chain(chain_to_check) {
		let current_index = 1
		let last_block = chain_to_check[0]
		while (current_index < chain_to_check.length) {
			let block: Block = chain_to_check[current_index]
			if (block.previous_hash != this.hash(block)) {
				return false
			}
			last_block = block
			current_index += 1
		}
		return true
	}

	public resolve_conflicts() {
		const neighbours = this.nodes
		const that = this
		let new_chain = null
		let flag = 0
		let tmp_length = 0
		let max_length = this.chain.length
		neighbours.forEach((node: URL) => {
			axios.get(node.origin + "/chain").then((res) => {
				let new_chain = res.data
				if (that.valid_chain(new_chain) && new_chain.length > max_length) {
					that._chain = new_chain
					max_length = new_chain.length
				}
			})
			// var xmlHttp = new XMLHttpRequest()
			// xmlHttp.onreadystatechange = () => {
			// 	if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			// 		let new_chain = JSON.parse(xmlHttp.responseText)
			// 		if (that.valid_chain(new_chain) && new_chain.length > max_length) {
			// 			that._chain = new_chain
			// 			max_length = new_chain.length
			// 		}
			// 	}
			// }
			// xmlHttp.open("GET", node.origin + "/chain", true) // True for asynchronouse
			// xmlHttp.send(null)
		})
	}
}

var blockchain = new Blockchain()
module.exports = blockchain
