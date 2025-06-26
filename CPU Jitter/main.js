import * as math from './math.js';

/**
 * Compiles two shaders, links them together, looks up their uniform locations,
 * and returns the result. Reports any shader errors to the console.
 *
 * @param {string} vs_source - the source code of the vertex shader
 * @param {string} fs_source - the source code of the fragment shader
 * @return {WebGLProgram} the compiled and linked program
 */
function compileShader(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
     /**
     * loop through all uniforms in the shader source code
     * get their locations and store them in the GLSL program object for later use
     */
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms

    return program
}

/**
 * For every vertex stored in the vertex buffer, applies a math.random function to translate 
 * the vertices by a small amount and returns a new buffer with updated vertices. 
 * @return {updated_positions}, the array containing modified vertices
 */
function updateVertices() {
    const updated_positions = vertices.map((vertex, index)=> {
        const jitter = Math.random() * .9 * 0.05- 0.05;
        return vertex + jitter;
    });
    return updated_positions
}

/**
 * Sets up the various attribute buffers and the vertex array object to send 
 * the geometry from the CPU to the GPU. Also sets up the mode for the draw command.
 * 
 * 
 * @param {geom}, contains the data to plot 
 * @returns an object with 4 keys:
 * - mode =  the 1st argument for gl.drawElements
 * - count - the 2nd argument for gl.drawElements
 * - type = the 3rd argument for gl.drawElements
 * - vao = the vertex array object for use with gl.bindVertexArray
 */
function setupGeomery(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)
    for(let i=0; i<geom.attributes.length; i+=1) {
        //create buffer to send points to the GPU
        let buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        let f32 = new Float32Array(geom.attributes[i].flat())
        if (i == 0) {
            window.positionBuffer = buf
            window.vertices = f32
            window.vertexAttributeSize = geom.attributes[i][0].length
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)           
        }
        else {
            gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)           
        }   
        gl.vertexAttribPointer(i, geom.attributes[i][0].length, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(i)
    }

    var indices = new Uint16Array(geom.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: triangleArray
    }
}

/**
 * Clears the screen, modifies the vertices by calling update vertices 
 * for every frame, and sets up uniforms for the model matrix and the 
 * scale matrix, and asks the GPU to draw triangles based on the given geometry. 
 * 
 * @param {Number} seconds - the number of seconds since the animation began
 */
function draw(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT) 
    gl.useProgram(program)
 
    let scaleMatrix = math.m4scale(.6, .6, .6)
    // values that do not vary between vertexes or fragments are called "uniforms"
    gl.uniform1f(program.uniforms.seconds, milliseconds/1000)
    let m = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
    let mv  = math.m4mul(m, scaleMatrix)
    gl.uniformMatrix4fv(program.uniforms.mv, false, mv)
    gl.bindVertexArray(geom.vao)
    //update the vertices by a small amount
    let updated_vertices = updateVertices()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, updated_vertices, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)

    gl.drawElements(geom.mode, geom.count, geom.type, 0)
} 

/**
 * Runs the animation using requestAnimationFrame. This is like a loop that
 * runs once per screen refresh, but a loop won't work because we need to let
 * the browser do other things between ticks. Instead, we have a function that
 * requests itself be queued to be run again as its last step.
 * 
 * @param {Number} milliseconds - milliseconds since web page loaded; 
 *        automatically provided by the browser when invoked with
 *        requestAnimationFrame
 */
function tick(milliseconds) {
    draw(milliseconds)
    requestAnimationFrame(tick) // asks browser to call tick before next frame
}

/**
 * Fetches, reads, and compiles GLSL; sets two global variables; and begins
 * the animation
 */
window.addEventListener('load', async (event) => {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('vs.glsl').then(res => res.text())
    let fs = await fetch('fs.glsl').then(res => res.text())
    window.program = compileShader(vs,fs)
    let data = await fetch('geometry.json').then(r=>r.json())
    window.geom = setupGeomery(data)
    requestAnimationFrame(tick) // asks browser to call tick before first frame
})

