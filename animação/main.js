// ==================================================
// 1. CONFIGURAÇÃO INICIAL DO WEBGL
// ==================================================
const canvas = document.getElementById("canvas");
canvas.width = 800; 
canvas.height = 600;
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}
gl.viewport(0, 0, canvas.width, canvas.height);

// ==================================================
// 2. SHADERS E PROGRAMA
// ==================================================
const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform mat3 u_transform;
void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform vec3 uColor;
out vec4 outColor;
void main() {
    outColor = vec4(uColor, 1.0);
}
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getUniformLocation(program, "uColor");
const transformLocation = gl.getUniformLocation(program, "u_transform");

// ==================================================
// 3. POO: CLASSE BASE (SceneObject)
// ==================================================
class SceneObject {
    constructor(vertices, color, mode) {
        this.vertices = new Float32Array(vertices);
        // Pega apenas RGB, ignorando o Alpha[cite: 10]
        this.color = new Float32Array([color[0], color[1], color[2]]); 
        this.mode = mode; // Suporta TRIANGLE_STRIP e TRIANGLE_FAN[cite: 10]
        this.modelTransform = m3.identity();
    }

    atualizarTransformacao(novaMatriz) {
        this.modelTransform = novaMatriz;
    }

    draw(gl, posLoc, colLoc, matLoc, buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform3fv(colLoc, this.color);
        gl.uniformMatrix3fv(matLoc, false, this.modelTransform);
        
        // Desenha usando o modo específico da peça[cite: 10]
        gl.drawArrays(this.mode, 0, this.vertices.length / 2); 
    }
}

// ==================================================
// 4. POO: COMPOSIÇÃO (Classe RoboDetalhado)
// ==================================================
class RoboDetalhado {
    constructor() {
        // Agrupamos as partes lógicas em arrays para facilitar o desenho
        this.troncoECabeca = [];
        this.bracoEsq = [];
        this.bracoDir = [];
        this.pernaEsq = [];
        this.pernaDir = [];

        this.tempo = 0;

        // --- CONSTRUÇÃO DO CORPO CENTRAL ---
        // Cabeça (FAN) e Cor azul clara[cite: 10]
        this.troncoECabeca.push(new SceneObject([0.0, 0.65, -0.1, 0.65, 0.1, 0.65, 0.1, 0.3, -0.1, 0.3, -0.1, 0.65], [0.24, 0.83, 0.79], gl.TRIANGLE_FAN));
        // Olho Esq (Moldura e Lente)[cite: 10]
        this.troncoECabeca.push(new SceneObject([-0.08, 0.61, -0.02, 0.61, -0.08, 0.51, -0.02, 0.51], [0.4, 0.4, 0.45], gl.TRIANGLE_STRIP));
        this.troncoECabeca.push(new SceneObject([-0.07, 0.59, -0.03, 0.59, -0.07, 0.53, -0.03, 0.53], [1.0, 0.9, 0.2], gl.TRIANGLE_STRIP));
        // Olho Dir (Moldura e Lente)[cite: 10]
        this.troncoECabeca.push(new SceneObject([0.02, 0.61, 0.08, 0.61, 0.02, 0.51, 0.08, 0.51], [0.4, 0.4, 0.45], gl.TRIANGLE_STRIP));
        this.troncoECabeca.push(new SceneObject([0.03, 0.59, 0.07, 0.59, 0.03, 0.53, 0.07, 0.53], [1.0, 0.9, 0.2], gl.TRIANGLE_STRIP));
        // Antena (Haste cinza e Ponta luz)[cite: 10]
        this.troncoECabeca.push(new SceneObject([-0.02, 0.65, 0.02, 0.65, -0.02, 0.75, 0.02, 0.75], [0.5, 0.5, 0.5], gl.TRIANGLE_STRIP));
        this.troncoECabeca.push(new SceneObject([-0.05, 0.75, 0.05, 0.75, -0.05, 0.85, 0.05, 0.85], [1.0, 0.8, 0.0], gl.TRIANGLE_STRIP));
        // Corpo Base (Cor de pele)[cite: 10]
        this.troncoECabeca.push(new SceneObject([-0.2, 0.45, 0.2, 0.45, -0.2, 0.0, 0.2, 0.0], [0.94, 0.76, 0.76], gl.TRIANGLE_STRIP));
        // Painel e Botão Neon[cite: 10]
        this.troncoECabeca.push(new SceneObject([-0.12, 0.35, 0.12, 0.35, -0.12, 0.10, 0.12, 0.10], [0.1, 0.1, 0.1], gl.TRIANGLE_STRIP));
        this.troncoECabeca.push(new SceneObject([-0.08, 0.30, 0.08, 0.30, -0.08, 0.15, 0.08, 0.15], [0.0, 1.0, 0.5], gl.TRIANGLE_STRIP));

        // --- BRAÇO ESQUERDO (Ombro e Braço Vermelho) ---[cite: 10]
        this.bracoEsq.push(new SceneObject([-0.32, 0.45, -0.18, 0.45, -0.32, 0.35, -0.18, 0.35], [0.4, 0.4, 0.4], gl.TRIANGLE_STRIP));
        this.bracoEsq.push(new SceneObject([-0.3, 0.4, -0.2, 0.4, -0.3, 0.1, -0.2, 0.1], [0.7, 0.2, 0.2], gl.TRIANGLE_STRIP));

        // --- BRAÇO DIREITO (Ombro e Braço Vermelho) ---[cite: 10]
        this.bracoDir.push(new SceneObject([0.18, 0.45, 0.32, 0.45, 0.18, 0.35, 0.32, 0.35], [0.4, 0.4, 0.4], gl.TRIANGLE_STRIP));
        this.bracoDir.push(new SceneObject([0.2, 0.4, 0.3, 0.4, 0.2, 0.1, 0.3, 0.1], [0.7, 0.2, 0.2], gl.TRIANGLE_STRIP));

        // --- PERNA ESQUERDA (Perna Azul e Pé Cinza) ---[cite: 10]
        this.pernaEsq.push(new SceneObject([-0.15, -0.0, -0.05, -0.0, -0.15, -0.4, -0.05, -0.4], [0.2, 0.2, 0.7], gl.TRIANGLE_STRIP));
        this.pernaEsq.push(new SceneObject([-0.20, -0.40, -0.01, -0.40, -0.20, -0.5, -0.01, -0.5], [0.3, 0.3, 0.3], gl.TRIANGLE_STRIP));

        // --- PERNA DIREITA (Perna Azul e Pé Cinza) ---[cite: 10]
        this.pernaDir.push(new SceneObject([0.05, -0.0, 0.15, -0.0, 0.05, -0.4, 0.15, -0.4], [0.2, 0.2, 0.7], gl.TRIANGLE_STRIP));
        this.pernaDir.push(new SceneObject([0.01, -0.40, 0.20, -0.40, 0.01, -0.5, 0.20, -0.5], [0.3, 0.3, 0.3], gl.TRIANGLE_STRIP));
    }

    // Função auxiliar matemática para rotacionar um membro em torno de sua articulação exata
    rotacionarNoPivo(matrizBase, pivoX, pivoY, angulo) {
        let mat = m3.translate(matrizBase, pivoX, pivoY); // Vai até a junta (ombro/quadril)
        mat = m3.rotate(mat, angulo);                     // Aplica a rotação
        mat = m3.translate(mat, -pivoX, -pivoY);          // Retorna os vértices pro lugar
        return mat;
    }

    animar(deltaTime) {
        this.tempo += deltaTime;

        // Movimento global (Andando para os lados suavemente)
        let posX = Math.sin(this.tempo) * 0.6;
        let posY = Math.abs(Math.sin(this.tempo * 6)) * 0.03; // Pulo bem suave ao andar
        let matBase = m3.translation(posX, posY);

        // 1. Atualiza Tronco e Cabeça Inteiros
        this.troncoECabeca.forEach(parte => parte.atualizarTransformacao(matBase));

        // 2. Atualiza Braços
        let oscilacao = Math.sin(this.tempo * 6);
        
        // REDUZIMOS O ÂNGULO: De 0.6 para 0.15 (movimento bem curtinho)
        let anguloBraco = oscilacao * 0.15; 
        
        let matBracoEsq = this.rotacionarNoPivo(matBase, -0.25, 0.4, anguloBraco);
        this.bracoEsq.forEach(parte => parte.atualizarTransformacao(matBracoEsq));

        let matBracoDir = this.rotacionarNoPivo(matBase, 0.25, 0.4, -anguloBraco);
        this.bracoDir.forEach(parte => parte.atualizarTransformacao(matBracoDir));

        // 3. Atualiza Pernas (Marcha oposta aos braços)
        // REDUZIMOS O ÂNGULO: De 0.5 para 0.15
        let anguloPerna = oscilacao * 0.15;
        
        let matPernaEsq = this.rotacionarNoPivo(matBase, -0.1, 0.0, -anguloPerna);
        this.pernaEsq.forEach(parte => parte.atualizarTransformacao(matPernaEsq));

        let matPernaDir = this.rotacionarNoPivo(matBase, 0.1, 0.0, anguloPerna);
        this.pernaDir.forEach(parte => parte.atualizarTransformacao(matPernaDir));
    }

    draw(gl, posLoc, colLoc, matLoc, buffer) {
        // Renderiza cada grupo de objetos
        const desenharGrupo = (grupo) => {
            grupo.forEach(parte => parte.draw(gl, posLoc, colLoc, matLoc, buffer));
        };

        desenharGrupo(this.pernaEsq);
        desenharGrupo(this.pernaDir);
        desenharGrupo(this.bracoEsq);
        desenharGrupo(this.bracoDir);
        desenharGrupo(this.troncoECabeca);
    }
}

// ==================================================
// 5. INICIALIZAÇÃO E LOOP DE ANIMAÇÃO
// ==================================================
const verticesBuffer = gl.createBuffer();
const meuRobo = new RoboDetalhado();
let tempoAnterior = 0;

function drawScene(tempoAtual) {
    tempoAtual *= 0.001; 
    let deltaTime = tempoAtual - tempoAnterior;
    tempoAnterior = tempoAtual;

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    meuRobo.animar(deltaTime);
    meuRobo.draw(gl, positionLocation, colorLocation, transformLocation, verticesBuffer);

    requestAnimationFrame(drawScene);
}

requestAnimationFrame(drawScene);