import * as math from './math.js';

let cameraPosition = [0, 5, 2]
let forwardVec = math.normalize([0,-5,-2, 0])
let v = math.m4view(cameraPosition, math.add(forwardVec, cameraPosition), [0,0,1])
const cameraSpeed = 0.01
const globalUp = [0, 0, 1];

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
 * Creates geometry for flat, rectangular terrain from specified gridsize. Each vertex has a 
 * associated position, color and normal initialized to 0. Terrain is created in xy plane.
 * 
 * @param {gridsize} - number of vertices across and down
 * @returns {Object} - object containing terrain data with triangle, positions, 
 *                     colors and normals
 */
function makeTerrain(gridSize) {
    var terrain = 
            {"triangles":[],
             "attributes": [
                            //position
                            [],
                            //color
                            [],
                            //normals
                            []
                           ] 
            }

    for (let i=0; i < gridSize ; i +=1) {
        for(let j=0; j < gridSize; j +=1) { 
            let x = (j / (gridSize)) * 2 - 1
            let y  = (i / (gridSize)) * 2 - 1
            let z = 0.0
            terrain.attributes[0].push([x, y, z])
            terrain.attributes[1].push([0.75, 0.6, 0.42, 1])
            terrain.attributes[2].push([0, 0, 0])
        }
    }        
    for (let i=0; i < gridSize - 1 ; i +=1) {
        for(let j=0; j < gridSize -1; j +=1) {
            const v0 = i * gridSize + j
            const v1 = v0 + 1
            const v2 = (i + 1) * gridSize + j
            const v3 = v2 + 1
            terrain.triangles.push([v0, v2, v1])
            terrain.triangles.push([v1, v2, v3])
        }
    }
    return terrain
}

/**
 * Applies faulting process by creating peaks. Selects random points
 * and creates fault lines through them. Vertices are raised on one side and 
 * lowered on the other. Then the terrain is normalized and normals are computed.
 * 
 * @param {*} terrain - terrain object with positions, colors and normals
 * @param {*} gridSize - size of grid, determined from input
 * @param {*} faults - number of faults, determined from input
 */
function applyFaults(terrain, gridSize, faults) {
    const size = gridSize 
    const step = gridSize / faults
    for (let fault=0; fault < faults; fault += 1) {
        const randomIndex = Math.floor(Math.random() * (gridSize * gridSize))
        
        let point = terrain.attributes[0][randomIndex]
        const px = point[0]
        const py = point[1]

        const theta = Math.random() * 2 * Math.PI
        const nx = Math.cos(theta)
        const ny = Math.sin(theta)

        for (let i=0; i < terrain.attributes[0].length; i +=1) {
            const vertex = terrain.attributes[0][i]
            const bx = vertex[0]
            const by = vertex[1]

            const dotProduct = ((bx - px) * nx + (by -py) * ny) 
            if (dotProduct >= 0) {
                vertex[2] += 0.1
            }     
            else {
                vertex[2] -= 0.1
            }    

        }
    }
    let minHeight  = Infinity
    let maxHeight = -Infinity
    for (let vertex of terrain.attributes[0]) {
        minHeight = Math.min(minHeight, vertex[2])
        maxHeight = Math.max(maxHeight, vertex[2])
    }

    const c = 1.1 //constant controlling the height of the height of the highest peak
    for (let vertex of terrain.attributes[0]) {
        vertex[2] = c * (vertex[2] - 0.5 * (maxHeight + minHeight)) / (maxHeight - minHeight)
    }
    computeVertexNormals(terrain, gridSize)   

}

/**
 * Compute normal vectors for each vertex in the terrain based on the positions
 * of vertices. Iterates through the grid of vertices, calculates normals using the 
 * cross product and stores in terrain attributes. 
 * 
 * @param {*} terrain - object representing the terrain 
 * @param {*} gridSize - size of grid from user input
 */
function computeVertexNormals(terrain, gridSize) {
    const numRows = gridSize;
    const numCols = gridSize;

    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {

            const currentIndex  = i * numCols + j
            
            const nIndex= (i > 0)? (i - 1) * numCols + j: currentIndex
            const sIndex = (i < (numRows - 1))? (i+1) * numCols + j : currentIndex
            const wIndex = (j > 0)? i * numCols + (j - 1): currentIndex
            const eIndex = (j < (numCols - 1))? i * numCols + (j+1): currentIndex

            let n = terrain.attributes[0][nIndex]
            let s = terrain.attributes[0][sIndex]
            let w = terrain.attributes[0][wIndex]
            let e = terrain.attributes[0][eIndex]

            let crossProduct = math.cross(math.sub(n, s), math.sub(w, e))
            let normal = math.normalize(crossProduct)
            terrain.attributes[2][currentIndex] = normal
        }
    }

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
        let buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        let f32 = new Float32Array(geom.attributes[i].flat())
        gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)
        
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
 * Calculates the rotation matrix for a 3D vector to rotate around a specific axis
 * by a certain angle
 * @param {*} axis - axis around which to rotate the vector
 * @param {*} theta - angle in radians by which to rotate
 * @returns {Float32Array} - 4x4 rotation matrix 
 */
function rotateAroundAxis(axis, theta) {
    const normalizedAxis = math.normalize(axis);
    const [rx, ry, rz] = normalizedAxis;

    const c = Math.cos(theta);
    const s = Math.sin(theta);

    return new Float32Array([
        rx*rx*(1-c) + c,     rx*ry*(1-c) + rz*s, rx*rz*(1-c) - ry*s, 0,
        rx*ry*(1-c) - rz*s, ry*ry*(1-c) + c,     ry*rz*(1-c) + rx*s, 0,
        rx*rz*(1-c) + ry*s, ry*rz*(1-c) - rx*s, rz*rz*(1-c) + c,     0,
        0,                   0,                   0,                   1
    ])

}

/**
 * Clears the previous frame, sets up necessary WebGL state and applies transformations based on 
 * user input for camera movement and rotation.
 * @param {*} milliseconds - current time in milliseconds
 */
function draw(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) 
    gl.useProgram(program)
    gl.bindVertexArray(geom.vao)
    
    // values that do not vary between vertexes or fragments are called "uniforms"
    gl.uniform1f(program.uniforms.seconds, milliseconds/1000)
    gl.uniform4fv(program.uniforms.color, [0.75, 0.64, 0.25, 1])

    let ld = math.normalize([0.3, 1, 1])
    gl.uniform3fv(program.uniforms.lightdir, ld)
    gl.uniform3fv(program.uniforms.lightcolor, [1.0, 1.0, 1.0])
    let h = math.normalize(math.add(ld, [0, 0, 1]))
    gl.uniform3fv(program.uniforms.halfway_vector, h)

    let seconds = milliseconds / 1000
    let m = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
    const rightDirection = math.normalize(math.cross(forwardVec, globalUp));

    if (keysBeingPressed['w']) {
        cameraPosition = math.add(math.mul(forwardVec, cameraSpeed), cameraPosition)
        v = math.m4view(cameraPosition, math.add(forwardVec, cameraPosition), [0,0,1])
    }    
    else if (keysBeingPressed['s']) {
        cameraPosition = math.add(math.mul(forwardVec, -cameraSpeed), cameraPosition)
        v = math.m4view(cameraPosition, math.add(forwardVec, cameraPosition), [0,0,1])
    }    
    else if (keysBeingPressed['a']) {
        cameraPosition = math.sub(cameraPosition, math.mul(rightDirection, cameraSpeed));  // Move left
        v = math.m4view(cameraPosition, math.add(forwardVec, cameraPosition), globalUp);
    }    
    else if (keysBeingPressed['d']) {
        cameraPosition = math.add(cameraPosition, math.mul(rightDirection, cameraSpeed));
        v = math.m4view(cameraPosition, math.add(forwardVec, cameraPosition), globalUp);
    } else if (keysBeingPressed['ArrowUp']) {
        const rotationMatrix = rotateAroundAxis(rightDirection, cameraSpeed);
        forwardVec = math.m4mul(rotationMatrix, forwardVec);
    } else if (keysBeingPressed['ArrowDown']) {
        const rotationMatrix = rotateAroundAxis(rightDirection, -cameraSpeed);
        forwardVec = math.m4mul(rotationMatrix, forwardVec);
    } else if (keysBeingPressed['ArrowLeft']) {
        const rotationMatrix = rotateAroundAxis(globalUp, cameraSpeed);
        forwardVec = math.m4mul(rotationMatrix, forwardVec);
    } else if (keysBeingPressed['ArrowRight']) {
        const rotationMatrix = rotateAroundAxis(globalUp, -cameraSpeed);
        forwardVec = math.m4mul(rotationMatrix, forwardVec);
    }
    const upDirection = math.cross(rightDirection, forwardVec);
    const R = new Float32Array([
        rightDirection[0], upDirection[0], -forwardVec[0], 0,
        rightDirection[1], upDirection[1], -forwardVec[1], 0,
        rightDirection[2], upDirection[2], -forwardVec[2], 0,
        0,                  0,              0,              1
    ]);
    const T = math.m4trans(-cameraPosition[0], -cameraPosition[1], -cameraPosition[2]);
    const V = math.m4mul(R, T);
    //gl.uniformMatrix4fv(program.uniforms.mv, false, math.m4mul(v,math.m4mul(m, scaleMatrix)))
    gl.uniformMatrix4fv(program.uniforms.mv, false, V)
    gl.uniformMatrix4fv(program.uniforms.p, false, p)
    gl.bindVertexArray(geom.vao)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

/**
 * Resizes the canvas to completely fill the screen
 */
function fillscreen() {
    let canvas =  document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    if (window.gl) {
        gl.viewport(0,0,canvas.width, canvas.height) 
        window.p = math.m4perspNegZ(0.1, 30, 1, canvas.width, canvas.height)
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
let animationStarted = false;
function tick(milliseconds) {
    draw(milliseconds)
    requestAnimationFrame(tick) // asks browser to call tick before next frame
}

/**
 * Fetches, reads, and compiles GLSL; sets up terrain gridsize and faults randomly 
 * computes geometry for terrain, applies faults, and begins
 * the animation
 */
window.addEventListener('load', async (event) => {
    window.gl = document.querySelector('canvas').getContext('webgl2', 
                                       {antialias: false, depth: true, preserveDrawingBuffer: true})
    
    let vs = await fetch('VertexShader.glsl').then(res => res.text())
    let fs = await fetch('FragmentShader.glsl').then(res => res.text())
    window.program = compileShader(vs,fs)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    let gridsize = Math.floor(Math.random() * 253) + 2
    let faults = Math.floor(Math.random() * 200)
    let terrain_data = makeTerrain(gridsize)
    applyFaults(terrain_data, gridsize, faults)
    window.geom = setupGeomery(terrain_data)
    window.keysBeingPressed = {}
    window.addEventListener('keydown', event => keysBeingPressed[event.key] = true)
    window.addEventListener('keyup', event => keysBeingPressed[event.key] = false)
    fillscreen()
    window.addEventListener('resize', fillscreen)
    if (!animationStarted) {  // Check if animation has already been started
        animationStarted = true;
        requestAnimationFrame(tick);
    }
})

