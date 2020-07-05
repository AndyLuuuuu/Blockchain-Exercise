var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
var QuikChain = require("./blockchain");
function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
var node_id = uuidv4();
app.get("/", function (req, res) {
    res.send(QuikChain.chain);
});
app.get("/chain", function (req, res) {
    res.send(QuikChain.chain);
});
app.get("/mine", function (req, res) {
    var last_block = QuikChain.last_block();
    var last_proof = last_block == 0 ? 0 : last_block.proof;
    var proof = QuikChain.proof_of_work(last_proof);
    /*
        Add a bitcoin for the miner
        0 in sender means it is being mined (no sender, sender is the blockchain)
        recipient is node ID
    */
    var index = QuikChain.new_transaction(0, node_id, 1);
    var previous_hash = QuikChain.hash(last_block);
    var block = QuikChain.new_block(proof, previous_hash);
    res.send(block);
});
app.post("/transactions/new", function (req, res) {
    if (req.query.sender === "" ||
        req.query.amount === "" ||
        req.query.recipient === "") {
        res.send("Missing values");
        return;
    }
    var index = QuikChain.new_transaction(req.query.sender, req.query.recipient, req.query.amount);
    res.send("Transaction will be added to block " + index);
});
app.post("/nodes/register", function (req, res) {
    var nodes = req.body.nodes;
    if (nodes === "") {
        res.send("Provide a list of nodes or leave me alone");
        return;
    }
    nodes.forEach(function (element) {
        QuikChain.register_node(element);
    });
    res.send("Nodes will be added to the block ");
});
app.get("/nodes/resolve", function (req, res) {
    var replaced = QuikChain.resolve_conflicts();
    res.send(Blockchain);
});
var myArgs = process.argv.slice(2)[0];
console.log("Launching bitnode in port: ", myArgs);
var server = app.listen(myArgs, function () { });
