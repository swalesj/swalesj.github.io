/**
 * Created by Josh Techentin on 2/14/2017.
 */

class Sphere {
    /**
     * Create a 3D truncated cone with tip at the Z+ axis and base on the XY plane
     * @param {Object} gl      the current WebGL context
     * @param {Number} radius  radius of the sphere
     * @param {Number} subDiv  number of radial subdivision of the sphere
     * @param {Number} vertStacks  number of vertical stacks on the sphere
     * @param {vec3}   col1    color #1 to use
     * @param {vec3}   col2    color #2 to use
     */
    constructor (gl, radius, subDiv, vertStacks, col1, col2) {

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
        vertices.push(0,0,radius); /* center of the top of the sphere */
        vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
        vertices.push(randColor[0], randColor[1], randColor[2]);

        // create the top part of the sphere
        for (let i = 0; i < subDiv; i++) {
            let angle = i * 2 * Math.PI / subDiv;
            let subRadius = Math.sqrt(Math.pow(radius, 2) - Math.pow((vertStacks - 1) * radius / vertStacks, 2));
            let x = subRadius * Math.cos(angle);
            let y = subRadius * Math.sin(angle);
            vertices.push(x, y, (vertStacks - 1) * radius / vertStacks);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }

        // create the middle of the sphere
        for (let j = 2; j < vertStacks * 2 - 1; j++) {
            for (let i = 0; i < subDiv; i++) {
                let angle = i * 2 * Math.PI / subDiv;
                if (j <= vertStacks) {
                    let distance = Math.sqrt(Math.pow(radius, 2) - Math.pow((vertStacks - j) * radius / vertStacks, 2));
                    let x = distance * Math.cos(angle);
                    let y = distance * Math.sin(angle);
                    vertices.push(x, y, (vertStacks - j) * radius / vertStacks);
                    vec3.lerp(randColor, col1, col2, Math.random());
                    vertices.push(randColor[0], randColor[1], randColor[2]);
                } else {
                    let distance = Math.sqrt(Math.pow(radius, 2) - Math.pow((j - vertStacks) * radius / vertStacks, 2));
                    let x = distance * Math.cos(angle);
                    let y = distance * Math.sin(angle);
                    vertices.push(x, y, -(j - vertStacks) * radius / vertStacks);
                    vec3.lerp(randColor, col1, col2, Math.random());
                    vertices.push(randColor[0], randColor[1], randColor[2]);
                }
            }
        }

        // create the bottom part of the sphere
        for (let i = 0; i < subDiv; i++) {
            let angle = i * 2 * Math.PI / subDiv;
            let subRadius = Math.sqrt(Math.pow(radius, 2) - Math.pow((vertStacks - 1) * radius / vertStacks, 2));
            let x = subRadius * Math.cos(angle);
            let y = subRadius * Math.sin(angle);
            vertices.push(x, y, -(vertStacks - 1) * radius / vertStacks);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }
        vertices.push(0,0,-radius); /* center of the bottom of the sphere */
        vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
        vertices.push(randColor[0], randColor[1], randColor[2]);

        /* copy the (x,y,z,r,g,b) sixtuplet into GPU buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

        // Generate index order for the top of the sphere
        let topIndex = [];
        topIndex.push(0);
        for (let k = 1; k <= subDiv; k++)
            topIndex.push(k);
        topIndex.push(1);
        this.topIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.topIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(topIndex), gl.STATIC_DRAW);

        // Generate index order for middle of the sphere
        let halfIndex = [];
        this.halfIdxBuff = [];
        for (let i = 0; i < vertStacks * 2 - 2; i++) {
            halfIndex.push([]);
            for (let j = 1; j <= subDiv; j++) {
                halfIndex[i].push(i * subDiv + j);
                halfIndex[i].push((i + 1) * subDiv + j);
            }
            halfIndex[i].push(i * subDiv + 1);
            halfIndex[i].push((i + 1) * subDiv + 1);
            this.halfIdxBuff[i] = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.halfIdxBuff[i]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(halfIndex[i]), gl.STATIC_DRAW);
        }

        // Generate the index order for the bottom of the sphere
        let bottomIndex = [];
        bottomIndex.push((vertStacks * 2) * subDiv - subDiv + 1);
        for (let i = (vertStacks * 2) * subDiv - subDiv; i > (vertStacks * 2) * subDiv - 2 * subDiv; i--) {
            bottomIndex.push(i);
        }
        bottomIndex.push((vertStacks * 2) * subDiv - subDiv);
        this.bottomIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bottomIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(bottomIndex), gl.STATIC_DRAW);

        /* Put the indices as an array of objects. Each object has three attributes:
         primitive, buffer, and numPoints */
        this.indices = [{"primitive": gl.TRIANGLE_FAN, "buffer": this.topIdxBuff, "numPoints": topIndex.length}];
        for (let i = 0; i < halfIndex.length; i++) {
            this.indices.push({"primitive": gl.TRIANGLE_STRIP, "buffer": this.halfIdxBuff[i], "numPoints": halfIndex[i].length});
        }
        this.indices.push({"primitive": gl.TRIANGLE_FAN, "buffer": this.bottomIdxBuff, "numPoints": bottomIndex.length});
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