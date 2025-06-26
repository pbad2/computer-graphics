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
    
    // loop through all uniforms in the shader source code
    // get their locations and store them in the GLSL program object for later use
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms

    return program
}

/**
 * This creates the attribute buffers to send the attribute data to the GPU. 
 * @param {data}, attribute data as retrieved from the geometry json 
 * @param {loc}, location for the specific attribute in the GPU
 * @param {mode}, lets gpu know that data will not be changed between frames (gl.STATIC_DRAW)
 * @returns {buf}, pointer to the attribute buffer
 */
function supplyDataBuffer(data, loc, mode){
    if (mode == undefined) { 
        mode = gl.STATIC_DRAW
    }    
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)

    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)

    return buf;
}

/**
 * Creates a Vertex Array Object and puts into it all of the data in the given JSON structure.
 * @param {geom}, object that contains all the geometry for the figure. 
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
        let data = geom.attributes[i]
        supplyDataBuffer(data, i)
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
 * Clears the screen, sends uniforms for model matrix and perspective matrix to the GPU, and 
 * asks the GPU to draw several objects based on the geometry provided in geometry.json
 *
 * @param {Number} seconds - the number of seconds since the animation began
 */
function draw(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) 
    gl.useProgram(program)

    gl.bindVertexArray(geom.vao)
    
    // values that do not vary between vertexes or fragments are called "uniforms"
    gl.uniform1f(program.uniforms.seconds, milliseconds/1000)
    //let scaleMatrix = math.m4scale(.8, .8, .8)

    //Sun
    let sun_spin_speed = milliseconds/1000 * Math.PI
    let m = math.m4rotY(sun_spin_speed)
    let v = math.m4view([2,1,3.5],[0,0,0],[0,1,0])
    gl.uniformMatrix4fv(program.uniforms.mv, false, math.m4mul(v,m))
    gl.uniformMatrix4fv(program.uniforms.p, false, p)
    gl.bindVertexArray(geom.vao)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
    //Earth
    let earth_spin_speed = sun_spin_speed * 2.0
    let earth_orbital_speed =  sun_spin_speed * 0.4
    let scaleMatrix = math.m4scale(.35, .35, .25)
    let m_earth = math.m4mul(math.m4rotY(earth_orbital_speed), math.m4trans(1.6, 0, 0), math.m4rotY(earth_spin_speed), scaleMatrix)
    let m_earth_moon = math.m4mul(math.m4rotY(earth_orbital_speed), math.m4trans(1.6, 0, 0), scaleMatrix)
    gl.uniformMatrix4fv(program.uniforms.mv, false, math.m4mul(v,m_earth))
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
    //Mars
    let mars_spin_speed = earth_spin_speed / 2.2
    let mars_orbital_speed =  earth_orbital_speed/1.9
    scaleMatrix = math.m4scale(.2, .2, .15)
    let tiltAngle = Math.PI / 6. 
    let m_mars = math.m4mul(math.m4rotY(mars_orbital_speed), math.m4trans(2.56, 0, 0),math.m4rotY(mars_spin_speed), scaleMatrix)
    let m_mars_moon = math.m4mul(math.m4rotY(mars_orbital_speed), math.m4trans(2.56, 0, 0), scaleMatrix)
    gl.uniformMatrix4fv(program.uniforms.mv, false, math.m4mul(v,m_mars))
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
    
    //Moon orbiting around earth    
    gl.bindVertexArray(geom2.vao)
    let moon_orbital_speed =  earth_spin_speed / 2. 
    scaleMatrix = math.m4scale(.25, .25, .25)
    let m_moon = math.m4mul(m_earth_moon, math.m4rotY(moon_orbital_speed), math.m4trans(1.5, 0, 0), scaleMatrix)
    gl.uniformMatrix4fv(program.uniforms.mv, false, math.m4mul(v,m_moon))
    gl.drawElements(geom2.mode, geom2.count, geom2.type, 0)

    //Phobos moon orbiting around mars
    scaleMatrix = math.m4scale(.3, .3, .3)
    let phobos_orbital_speed =  mars_spin_speed * 4
    let m_phobos = math.m4mul(m_mars_moon, math.m4rotY(phobos_orbital_speed), math.m4trans(1.2, 0, 0), scaleMatrix)
    gl.uniformMatrix4fv(program.uniforms.mv, false, math.m4mul(v,m_phobos))
    gl.drawElements(geom2.mode, geom2.count, geom2.type, 0)

    //Deimos moon orbiting around mars
    scaleMatrix = math.m4scale(.15, .15, .15)
    let deimos_orbital_speed =  mars_spin_speed * 1.08
    let m_deimos = math.m4mul(m_mars_moon, math.m4rotY(deimos_orbital_speed ), math.m4trans(2.4, 0, 0), scaleMatrix)
    gl.uniformMatrix4fv(program.uniforms.mv, false, math.m4mul(v,m_deimos))
    gl.drawElements(geom2.mode, geom2.count, geom2.type, 0)

} 

/**
 * Resizes the canvas to completely fill the screen
 */
function fillscreen() {
    let canvas =  document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '100hv'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    if (window.gl) {
        gl.viewport(0,0,canvas.width, canvas.height) 
        window.p = math.m4perspNegZ(0.15, 70, 1.5, canvas.width, canvas.height)
    }
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
    window.gl = document.querySelector('canvas').getContext('webgl2', 
                                       {antialias: false, depth: true, preserveDrawingBuffer: true})
    
    let vs = await fetch('VertexShader.glsl').then(res => res.text())
    let fs = await fetch('FragmentShader.glsl').then(res => res.text())
    window.program = compileShader(vs,fs)
    gl.enable(gl.DEPTH_TEST)
    let octahedron_data = await fetch('octahedron.json').then(r=>r.json())
    window.geom = setupGeomery(octahedron_data)
    let tetrahedron_data = await fetch('tetrahedron.json').then(r=>r.json())
    window.geom2 = setupGeomery(tetrahedron_data)
    fillscreen()
    window.addEventListener('resize', fillscreen)
    requestAnimationFrame(tick) // asks browser to call tick before first frame
})
