var createHash = require("crypto");
var url = require("url");
var axios = require("axios")["default"];
var Block = /** @class */ (function () {
    function Block(index, timestamp, transactions, proof, previous_hash) {
        this._index = index;
        this._timestamp = timestamp;
        this._transactions = transactions;
        this._proof = proof;
        this._previous_hash = previous_hash;
    }
    Object.defineProperty(Block.prototype, "timestamp", {
        get: function () {
            return this._timestamp;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Block.prototype, "transactions", {
        get: function () {
            return this._transactions;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Block.prototype, "proof", {
        get: function () {
            return this._proof;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Block.prototype, "previous_hash", {
        get: function () {
            return this._previous_hash;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Block.prototype, "index", {
        get: function () {
            return this._index;
        },
        enumerable: false,
        configurable: true
    });
    return Block;
}());
var Blockchain = /** @class */ (function () {
    // Add genesis block
    function Blockchain() {
        this._chain = [];
        this._nodes = new Set();
        this._current_transactions = [];
        this.new_block(100, 1);
    }
    Object.defineProperty(Blockchain.prototype, "chain", {
        get: function () {
            return this._chain;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Blockchain.prototype, "nodes", {
        get: function () {
            return this._nodes;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Blockchain.prototype, "current_transactions", {
        get: function () {
            return this._current_transactions;
        },
        set: function (transactions) {
            this._current_transactions = transactions;
        },
        enumerable: false,
        configurable: true
    });
    Blockchain.prototype.hash = function (block) {
        var block_string = JSON.stringify(block);
        console.log("Block " + block_string);
        var base64_string = Buffer.from(block_string.toString()).toString("base64");
        var hash = createHash
            .createHash("sha256")
            .update(base64_string)
            .digest("base64");
        console.log("Creating Hash " + hash);
        return hash;
    };
    Blockchain.prototype.new_block = function (proof, previous_hash) {
        if (previous_hash === void 0) { previous_hash = null; }
        var that = this;
        var previous_index = this.chain.length == 0 ? 0 : this.chain.length - 1;
        /*
            - Important Notice regarding block creation:
            It is important to always use the constructor when creating blocks to ensure consistent hashes.
            If we create the block in a different way, then javascript orders the variables in it in different order
            This creates inconsistent hashes when Object is stringified and hashed since order is altered
        */
        var time = new Date();
        var block = new Block(that.chain.length + 1, time, that.current_transactions, proof, previous_hash || this.hash(this.chain[previous_index]));
        console.log(block);
        this.current_transactions = [];
        this.chain.push(block);
        return block;
    };
    Blockchain.prototype.last_block = function () {
        return this.chain.length == 0 ? 0 : this.chain[this.chain.length - 1];
    };
    Blockchain.prototype.new_transaction = function (sender, recipient, amount) {
        this.current_transactions.push({ sender: sender, recipient: recipient, amount: amount });
        return this.chain.length == 0
            ? 1
            : this.chain[this.chain.length - 1].index + 1;
    };
    Blockchain.prototype.proof_of_work = function (last_proof) {
        var proof = 0;
        while (!this.valid_proof(last_proof, proof)) {
            proof += 1;
        }
        console.log("Proof number found " + proof);
        return proof;
    };
    Blockchain.prototype.valid_proof = function (last_proof, proof) {
        var guess = Buffer.from(proof.toString().toString("base64")) +
            Buffer.from(last_proof.toString()).toString("base64");
        var hash = createHash.createHash("sha256").update(guess).digest("base64");
        return hash.startsWith("00");
    };
    Blockchain.prototype.register_node = function (address) {
        var parsed_url = new URL(address);
        this._nodes.add(parsed_url);
    };
    Blockchain.prototype.valid_chain = function (chain_to_check) {
        var current_index = 1;
        var last_block = chain_to_check[0];
        while (current_index < chain_to_check.length) {
            var block = chain_to_check[current_index];
            if (block.previous_hash != this.hash(block)) {
                return false;
            }
            last_block = block;
            current_index += 1;
        }
        return true;
    };
    Blockchain.prototype.resolve_conflicts = function () {
        var neighbours = this.nodes;
        var that = this;
        var new_chain = null;
        var flag = 0;
        var tmp_length = 0;
        var max_length = this.chain.length;
        neighbours.forEach(function (node) {
            axios.get(node.origin + "/chain").then(function (res) {
                var new_chain = res.data;
                if (that.valid_chain(new_chain) && new_chain.length > max_length) {
                    that._chain = new_chain;
                    max_length = new_chain.length;
                }
            });
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
        });
    };
    return Blockchain;
}());
var blockchain = new Blockchain();
module.exports = blockchain;
