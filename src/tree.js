
'use strict';

class Node {
    constructor(value){
        this.value = value;
        this.childrenAsKeyValue = {};
    }

    addChild(node, key){
        this.childrenAsKeyValue[key] = node;
    }
    setValue(val){
        if (val instanceof Node){
            this.value = val.value;
            this.childrenAsKeyValue = val.childrenAsKeyValue;
        }
    };

    getValue(){
        return this.value;
    }
}

module.exports = {Node};