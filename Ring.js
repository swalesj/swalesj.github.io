/**
 * Created by Josh Techentin on 2/13/2017.
 */

class Ring {
    /**
     * Create a 3D truncated cone with tip at the Z+ axis and base on the XY plane
     * @param {Object} gl      the current WebGL context
     * @param {Number} innerRadius  radius of the inner part of the ring
     * @param {Number} outerRadius  radius of the outer part of the ring
     * @param {Number} height  height of the ring
     * @param {Number} vertStacks  number of vertical stacks the ring is made of
     * @param {vec3}   col1    color #1 to use
     * @param {vec3}   col2    color #2 to use
     */
    constructor (gl, outerRadius, innerRadius, height, vertStacks, col1, col2) {

        /* if colors are undefined, generate random colors */
        if (typeof col1 === "undefined") col1 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        if (typeof col2 === "undefined") col2 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        let randColor = vec3.create();
        let vertices = [];
        this.vbuff = gl.createBuffer();

        /* Instead of allocating two separate JS arrays (one for position and one for color),
         in the following loop we pack both position and color
         so each tuple (x,y,z,r,g,b) describes the properties of a vertex
         */

        // create the top hoop inner points
        for (let i = 0; i < vertStacks; i++) {
            let angle = i * 2 * Math.PI / vertStacks;
            let x = innerRadius * Math.cos(angle);
            let y = innerRadius * Math.sin(angle);
            vertices.push(x, y, height);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }

        // create the top hoop outer points
        for (let i = 0; i < vertStacks; i++) {
            let angle = i * 2 * Math.PI / vertStacks;
            let x = outerRadius * Math.cos(angle);
            let y = outerRadius * Math.sin(angle);
            vertices.push(x, y, height);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }

        // create the bottom hoop inner points
        for (let i = 0; i < vertStacks; i++) {
            let angle = i * 2 * Math.PI / vertStacks;
            let x = innerRadius * Math.cos(angle);
            let y = innerRadius * Math.sin(angle);
            vertices.push(x, y, 0);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }

        // create the bottom hoop outer points
        for (let i = 0; i < vertStacks; i++) {
            let angle = i * 2 * Math.PI / vertStacks;
            let x = outerRadius * Math.cos(angle);
            let y = outerRadius * Math.sin(angle);
            vertices.push(x, y, 0);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }

        /* copy the (x,y,z,r,g,b) sixtuplet into GPU buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

        // Generate index order for top of ring
        let topIndex = [];
        for (let k = 0; k < vertStacks; k++) {
            topIndex.push(k);
            topIndex.push(k + vertStacks);
        }
        topIndex.push(0); // finish the hoop
        topIndex.push(vertStacks);
        this.topIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.topIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(topIndex), gl.STATIC_DRAW);

        // Generate index order for bottom of ring
        let botIndex = [];
        for (let k = vertStacks * 2; k < vertStacks * 3; k++) {
            botIndex.push(k + vertStacks);
            botIndex.push(k);
        }
        botIndex.push(vertStacks * 3); // finish the hoop
        botIndex.push(vertStacks * 2);
        this.botIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.botIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(botIndex), gl.STATIC_DRAW);

        // Generate index order for inner shell
        let innerIndex = [];
        for (let k = 0; k < vertStacks; k++) {
            innerIndex.push(k + vertStacks * 2);
            innerIndex.push(k);
        }
        innerIndex.push(vertStacks * 2);
        innerIndex.push(0);
        this.innerIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.innerIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(innerIndex), gl.STATIC_DRAW);

        // Generate index order for outer shell
        let outerIndex = [];
        for (let k = vertStacks; k < vertStacks * 2; k++) {
            outerIndex.push(k);
            outerIndex.push(k + vertStacks * 2);
        }
        outerIndex.push(vertStacks);
        outerIndex.push(vertStacks * 3);
        this.outerIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.outerIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(outerIndex), gl.STATIC_DRAW);

        /* Put the indices as an array of objects. Each object has three attributes:
         primitive, buffer, and numPoints */
        this.indices = [{"primitive": gl.TRIANGLE_STRIP, "buffer": this.topIdxBuff, "numPoints": topIndex.length},
            {"primitive": gl.TRIANGLE_STRIP, "buffer": this.botIdxBuff, "numPoints": botIndex.length},
            {"primitive": gl.TRIANGLE_STRIP, "buffer": this.innerIdxBuff, "numPoints": innerIndex.length},
            {"primitive": gl.TRIANGLE_STRIP, "buffer": this.outerIdxBuff, "numPoints": outerIndex.length}];
    }

    /**
     * Draw the object
     * @param {Number} vertexAttr a handle to a vec3 attribute in the vertex shader for vertex xyz-position
     * @param {Number} colorAttr  a handle to a vec3 attribute in the vertex shader for vertex rgb-color
     * @param {Number} modelUniform a handle to a mat4 uniform in the shader for the coordinate frame of the model
     * @param {mat4} coordFrame a JS mat4 variable that holds the actual coordinate frame of the object
     */
    draw(vertexAttr, colorAttr, modelUniform, coordFrame) {
        /* copy the coordinate frame matrix to the uniform memory in shader */
        gl.uniformMatrix4fv(modelUniform, false, coordFrame);

        /* binder the (vertex+color) buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);

        /* with the "packed layout"  (x,y,z,r,g,b),
         the stride distance between one group to the next is 24 bytes */
        gl.vertexAttribPointer(vertexAttr, 3, gl.FLOAT, false, 24, 0); /* (x,y,z) begins at offset 0 */
        gl.vertexAttribPointer(colorAttr, 3, gl.FLOAT, false, 24, 12); /* (r,g,b) begins at offset 12 */

        for (let k = 0; k < this.indices.length; k++) {
            let obj = this.indices[k];
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.buffer);
            gl.drawElements(obj.primitive, obj.numPoints, gl.UNSIGNED_SHORT, 0);
        }
    }
}