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

    var canvas = document.querySelector('#c')
    var gl = canvas.getContext('webgl')
    if (!gl) console.log('WebGL not supported')

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    var program = createProgram(gl, vertexShader, fragmentShader)
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution")
    var colorUniformLocation = gl.getUniformLocation(program, "u_color")

    var positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    gl.canvas.height = window.innerHeight
    gl.canvas.width = window.innerWidth

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    // 清空畫布
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 告訴它用我們之前寫好的着色程序（一個着色器對）
    gl.useProgram(program)

    // 設置全局變量 分辨率
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)
    gl.enableVertexAttribArray(positionAttributeLocation)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    var size = 2 // 每次迭代運行提取兩個單位數據
    var type = gl.FLOAT // 每個單位的數據類型是32位浮點型
    var normalize = false // 不需要歸一化數據
    var stride = 0
    // 0 = 移動單位數量 * 每個單位佔用內存（sizeof(type)）
    // 每次迭代運行運動多少內存到下一個數據開始點 

    var offset = 0 // 從緩衝起始位置開始讀取

    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

    for (var ii = 0; ii < 50; ++ii) {
        // 創建一個隨機矩形
        // 並將寫入位置緩衝
        // 因爲位置緩衝是我們綁定在
        // `ARRAY_BUFFER`綁定點上的最後一個緩衝
        setRectangle(gl,
            randomInt(gl.canvas.width / 2),
            randomInt(gl.canvas.height / 2),
            randomInt(gl.canvas.width / 2),
            randomInt(gl.canvas.height / 2)
        )

        // 設置一個隨機顏色
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1)

        // 繪製矩形
        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

}

window.onload = main




function randomInt(range) {
    return Math.floor(Math.random() * range)
}

function setRectangle(gl, x, y, width, height) {
    var x1 = x
    var x2 = x + width
    var y1 = y
    var y2 = y + height

    // 注意: gl.bufferData(gl.ARRAY_BUFFER, ...) 將會影響到
    // 當前綁定點`ARRAY_BUFFER`的綁定緩衝
    // 目前我們只有一個緩衝，如果我們有多個緩衝
    // 我們需要先將所需緩衝綁定到`ARRAY_BUFFER`

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2
    ]), gl.STATIC_DRAW)
}