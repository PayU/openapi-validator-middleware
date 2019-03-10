
'use strict';
/** Class representing a node in a tree structure, which each node has value and children(nodes) saving by key. */
class Node {
    /**
     * Create a node.
     * @param value - The value of the node.
     */
    constructor(value){
        this.value = value;
        this.childrenAsKeyValue = {};
    }
    /**
     * Add child to the node.
     * @param node - The node which going to be the child.
     * @param key - The key which is the identifier of the child.
     */
    addChild(node, key){
        this.childrenAsKeyValue[key] = node;
    }
    /**
     * Override node data by other node by reference.
     * @param node - The node which going to use to take his data.
     */
    setData(node){
        if (node instanceof Node){
            this.value = node.value;
            this.childrenAsKeyValue = node.childrenAsKeyValue;
        }
    };
    /**
     * Get node value.
     * @return The value of the node.
     */
    getValue(){
        return this.value;
    }
}

module.exports = { Node };