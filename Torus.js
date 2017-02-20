/**
 * Created by Josh Techentin on 2/14/2017.
 */

class Torus {
    /**
     * Create a 3D truncated cone with tip at the Z+ axis and base on the XY plane
     * @param {Object} gl      the current WebGL context
     * @param {Number} outerRadius  radius of the outside of the torus
     * @param {Number} innerRadius  radius of the inside of the torus
     * @param {Number} subDiv  number of segments the torus is broken into
     * @param {Number} subSubDiv  number of sub divisions for each segment of the torus
     * @param {vec3}   col1    color #1 to use
     * @param {vec3}   col2    color #2 to use
     */
    constructor (gl, outerRadius, innerRadius, subDiv, subSubDiv, col1, col2) {

        /* if colors are undefined, generate random colors */
        if (typeof col1 === "undefined") col1 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        if (typeof col2 === "undefined") col2 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        let randColor = vec3.create();
        let vertices = [];
        let smallRadius = (outerRadius - innerRadius) / 2;
        let centerRadius = innerRadius + smallRadius;
        this.vbuff = gl.createBuffer();

        /* Instead of allocating two separate JS arrays (one for position and one for color),
         in the following loop we pack both position and color
         so each tuple (x,y,z,r,g,b) describes the properties of a vertex
         */

        for (let i = 0; i < subDiv; i++) {
            let mainAngle = i * 2 * Math.PI / subDiv;
            for (let j = 0; j < subSubDiv; j++) {
                let subAngle = j * 2 * Math.PI / subSubDiv;
                let extraDistance = smallRadius * Math.cos(subAngle);
                let x = (centerRadius + extraDistance) * Math.cos(mainAngle);
                let y = (centerRadius + extraDistance) * Math.sin(mainAngle);
                let z = smallRadius * Math.sin(subAngle);
                vertices.push(x, y, z);
                vec3.lerp(randColor, col1, col2, Math.random());
                vertices.push(randColor[0], randColor[1], randColor[2]);
            }
        }

        /* copy the (x,y,z,r,g,b) sixtuplet into GPU buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

        // Generate index order for the torus
        let index = [];
        this.idxBuff = [];
        for (let i = 0; i < subDiv; i++) {
            index.push([]);
            for (let j = 0; j < subSubDiv; j++) {
                if (i < subDiv - 1)
                    index[i].push((i + 1) * subSubDiv + j);
                else
                    index[i].push(j);
                index[i].push(i * subSubDiv + j);
            }
            if (i < subDiv - 1)
                index[i].push((i + 1) * subSubDiv);
            else
                index[i].push(0);
            index[i].push(i * subSubDiv);
            this.idxBuff.push(gl.createBuffer());
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuff[i]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(index[i]), gl.STATIC_DRAW);
        }

        /* Put the indices as an array of objects. Each object has three attributes:
         primitive, buffer, and numPoints */
        this.indices = [];
        for (let i = 0; i < subDiv; i++) {
            this.indices.push({"primitive": gl.TRIANGLE_STRIP, "buffer": this.idxBuff[i], "numPoints": index[i].length});
        }
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