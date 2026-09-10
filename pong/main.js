const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL 2 não é suportado.");

gl.viewport(0, 0, canvas.width, canvas.height);

// Calcula o fator de correção para o eixo X não esticar
const aspect = canvas.height / canvas.width;
// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Center of the circle
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    1.0, 0.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 1.0, 1.0,
]);

// --------------------------------------------------
// VARIAVEIS DO PLACAR
// --------------------------------------------------
let pontosEsq = 0;
let pontosDir = 0;

function atualizarPlacar() {
    document.getElementById('pontosEsq').innerText = pontosEsq;
    document.getElementById('pontosDir').innerText = pontosDir;
}

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;


// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}

`;

// --------------------------------------------------
// COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// INICIALIZAR INTEGRAÇÃO TECLADO
//--------------------------------------------------

const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){
    
    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    let matrizBola = m3.translation(txBola, tyBola);
    matrizBola = m3.scale(matrizBola, aspect, 1.0);

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO
// --------------------------------------------------

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO E COLISÃO
// --------------------------------------------------

let tyBE = 0.0;
let tyBD = 0.0;
let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.007;
let tyBola_offset = 0.007;

const posXBarraEsquerda = -0.9;
const posXBarraDireita = 0.9;

const larguraBarra = 0.1; // de -0.05 a 0.05
const alturaBarra = 0.4;  // de -0.2 a 0.2
const raioBola = 0.05;
const velocidadeBarra = 0.015;
const limiteY = 0.8;      // Impede que a barra passe do teto/chão

function atualizaAnimacao(){
    // --- 1. CONTROLE DAS BARRAS VIA TECLADO ---
    
    // Barra Esquerda: W (cima) e S (baixo)
    if (keys['w'] || keys['W']) {
        tyBE += velocidadeBarra;
    }
    if (keys['s'] || keys['S']) {
        tyBE -= velocidadeBarra;
    }
    // Trava os limites da barra esquerda na tela
    if (tyBE > limiteY) tyBE = limiteY;
    if (tyBE < -limiteY) tyBE = -limiteY;

    // Barra Direita: Seta para Cima e Seta para Baixo
    if (keys['ArrowUp']) {
        tyBD += velocidadeBarra;
    }
    if (keys['ArrowDown']) {
        tyBD -= velocidadeBarra;
    }
    // Trava os limites da barra direita na tela
    if (tyBD > limiteY) tyBD = limiteY;
    if (tyBD < -limiteY) tyBD = -limiteY;

    // --- 2. MOVIMENTAÇÃO E FÍSICA DA BOLA ---
    txBola += txBola_offset;
    tyBola += tyBola_offset;

    // Colisão com o Teto e o Chão (Eixo Y)
    if (tyBola + raioBola > 1.0 || tyBola - raioBola < -1.0) {
        tyBola_offset = -tyBola_offset;
    }

    // Colisão com a Barra Esquerda
    let esqBarraX = posXBarraEsquerda - larguraBarra / 2;
    let dirBarraX = posXBarraEsquerda + larguraBarra / 2;
    let cimaBarraY = tyBE + alturaBarra / 2;
    let baixoBarraY = tyBE - alturaBarra / 2;

    if (txBola - raioBola <= dirBarraX && txBola + raioBola >= esqBarraX) {
        if (tyBola >= baixoBarraY && tyBola <= cimaBarraY) {
            txBola_offset = Math.abs(txBola_offset); // Rebate para a direita
        }
    }

    // Colisão com a Barra Direita
    let esqBarraDX = posXBarraDireita - larguraBarra / 2;
    let dirBarraDX = posXBarraDireita + larguraBarra / 2;
    let cimaBarraDY = tyBD + alturaBarra / 2;
    let baixoBarraDY = tyBD - alturaBarra / 2;

    if (txBola + raioBola >= esqBarraDX && txBola - raioBola <= dirBarraDX) {
        if (tyBola >= baixoBarraDY && tyBola <= cimaBarraDY) {
            txBola_offset = -Math.abs(txBola_offset); // Rebate para a esquerda
        }
    }

    // Condição de Ponto (Resetar se passar das laterais)
    if (txBola > 1.0) {
        pontosEsq++; // Ponto para a Esquerda
        atualizarPlacar();
        txBola = 0.0;
        tyBola = 0.0;
        txBola_offset = -txBola_offset;
    } else if (txBola < -1.0) {
        pontosDir++; // Ponto para a Direita
        atualizarPlacar();
        txBola = 0.0;
        tyBola = 0.0;
        txBola_offset = -txBola_offset;
    }

    // --- 3. ATUALIZAÇÃO DAS MATRIZES ---
    MbolaCentro = m3.translation(txBola, tyBola);
    MbarraEsquerda = m3.translation(posXBarraEsquerda, tyBE);
    MbarraDireita = m3.translation(posXBarraDireita, tyBD);
}


// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

drawScene();
