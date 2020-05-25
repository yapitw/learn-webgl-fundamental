// 創建着色器方法，輸入參數：渲染上下文，着色器類型，數據源

function createShader(gl, type, source) {
    var shader = gl.createShader(type) // 創建着色器對象
    gl.shaderSource(shader, source) // 提供數據源
    gl.compileShader(shader) // 編譯 -> 生成着色器
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (success) return shader

    console.log(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    var success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (success) return program
}

async function main() {
    var [vertexShaderSource, fragmentShaderSource] = await Promise.all([
        (await fetch('./shader.vert')).text(),
        (await fetch('./shader.frag')).text()
    ])


    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector('#canvas')
    var gl = canvas.getContext('webgl')
    if (!gl) return console.log('WebGL not supported')

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    // Setup GLSL program
    var program = createProgram(gl, vertexShader, fragmentShader)

    // Look up where the vertex data to go.
    var colorLocation = gl.getAttribLocation(program, "a_color")
    var positionLocation = gl.getAttribLocation(program, "a_position")

    // lookup uniforms
    var matrixLocation = gl.getUniformLocation(program, "u_matrix")

    // Tell it to user our program (pair of shaders)
    gl.useProgram(program)


    // Color attribute
    {
        // Turn on the color attribute
        gl.enableVertexAttribArray(colorLocation)

        // Create color buffer
        var colorBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        setColor(gl)

        // Tell the color attribute how to get data out of colorBuffer (ARRAY_BUFFER)
        var size = 4; // 4 components per iteration
        var type = gl.UNSIGNED_BYTE // the data is 8bit unsigned bytes
        var normalize = true // normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of teh buffer
        gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset)
    }


    // Position attribute
    {
        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation)

        // Create position buffer
        var positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        setGeometry(gl)

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
    }

    // Matrix properties
    var translation = [200, 150];
    var angleInRadians = 0;
    var scale = [1, 1];

    // Setup a ui.
    function setupUI() {
        webglLessonsUI.setupSlider("#x", { value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
        webglLessonsUI.setupSlider("#y", { value: translation[1], slide: updatePosition(1), max: gl.canvas.height });
        webglLessonsUI.setupSlider("#angle", { slide: updateAngle, max: 360 });
        webglLessonsUI.setupSlider("#scaleX", { value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2 });
        webglLessonsUI.setupSlider("#scaleY", { value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2 });
    }


    // Set color
    drawScene()
    setupUI()

    function updatePosition(index) {
        return function (event, ui) {
            translation[index] = ui.value;
            drawScene();
        };
    }

    function updateAngle(event, ui) {
        var angleInDegrees = 360 - ui.value;
        angleInRadians = angleInDegrees * Math.PI / 180;
        drawScene();
    }

    function updateScale(index) {
        return function (event, ui) {
            scale[index] = ui.value;
            drawScene();
        };
    }

    // Draw Scene
    function drawScene() {
        gl.canvas.height = window.innerHeight
        gl.canvas.width = window.innerWidth

        // Compute the matrix
        var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        matrix = m3.translate(matrix, translation[0], translation[1]);
        matrix = m3.rotate(matrix, angleInRadians);
        matrix = m3.scale(matrix, scale[0], scale[1]);

        // Set the matrix.
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        // Clear Canvas
        gl.clear(gl.COLOR_BUFFER_BIT)

        // Draw the geometry
        var primitiveType = gl.TRIANGLES
        var offset = 0
        var count = 6
        gl.drawArrays(primitiveType, offset, count)
    }

    window.onresize = function () {
        drawScene()
        setupUI()
    }
}

window.onload = main

// Set geometry buffer
function setGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -150, -100,
            150, -100,
            -150, 100,
            150, -100,
            -150, 100,
            150, 100
        ]),
        gl.STATIC_DRAW
    )
}

// Generate 2 random colors
function setColor(gl) {
    function rand256() {
        return Math.random() * 256
        // 0 to 255.99999 these values will be truncated when stored in the Uint8Array
    }

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([  // Uint8Array
            rand256(), rand256(), rand256(), 255,
            rand256(), rand256(), rand256(), 255,
            rand256(), rand256(), rand256(), 255,
            rand256(), rand256(), rand256(), 255,
            rand256(), rand256(), rand256(), 255,
            rand256(), rand256(), rand256(), 255,
        ]),
        gl.STATIC_DRAW
    )
}