/**
 * Created by w1 on 9/17/2015.
 */

w1 = w1 || {};

w1.gpgpu = function (renderer) {
    /**
     * Create an instance of w1.gpgpu
     *
     * @constructor
     * @this {w1.gpgpu}
     * @param {THREE.WebGLRenderer} renderer
     */
    var camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
    var scene = new THREE.Scene();
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1));
    scene.add(mesh);
    this.render = function (_scene, _camera, target) {
        renderer.render( _scene, _camera, target, false);
    };
    this.pass = function (shader, target) {
        mesh.material = shader.material;
        renderer.render(scene, camera, target, false);
    };
    //this.out = function (shader) {
    //    mesh.material = shader.material;
    //    renderer.render(scene, camera);
    //};
};

w1.gpgpu.runSimulationCode = function () {
    return [
        "uniform float timer;",
        "float rand(vec2 co){",
        "return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);",
        "}",
        "vec4 runSimulation(vec4 pos){",
        "float x = pos.x + timer;",
        "float y = pos.y;",
        "float z = pos.z;",
        "if(pos.w < 0.001 && pos.w > -0.001){",
        '    pos.x += sin( y * 3.0 ) * cos( z * 11.0 ) * 0.005;',
        '    pos.y += sin( x * 5.0 ) * cos( z * 13.0 ) * 0.005;',
        '    pos.z += sin( x * 7.0 ) * cos( y * 17.0 ) * 0.005;',
        "} else {",
        '    pos.y -= pos.w;',
        '    pos.w += 0.005;',
        '    if (pos.y < -2.0) {',
        '      pos.y += pos.w;',
        '      pos.w *= -0.3;',
        '    }',
        "}",
        "return pos;",
        "}"
    ].join("\n");
};
w1.gpgpu.simulationShader = function () {
    var material = new THREE.ShaderMaterial({
        uniforms: {
            tPositions: {type: "t", value: null},
            origin: {type: "t", value: null},
            timer: {type: "f", value: 0}
        },
        vertexShader: [
            "varying vec2 vUv;",
            "void main() {",
            "vUv = vec2(uv.x, 1.0 - uv.y);",
            "gl_Position = projectionMatrix * modelViewMatrix *vec4(position, 1.0);",
            "}"
        ].join("\n"),
        fragmentShader: [
            "varying vec2 vUv;",
            "uniform sampler2D tPositions;",
            "uniform sampler2D origin;",
            w1.gpgpu.runSimulationCode(),
            "void main() {",
            "vec4 pos = texture2D(tPositions, vUv);",
            "pos.w = 0.0;",
            "if(rand(vUv + timer) > 0.95) {",
            "pos = vec4(texture2D(origin, vUv).xyz, 0.0);",
            "} else {",
            "pos = runSimulation(pos);",
            "}",
            "gl_FragColor = pos;",
            "}"
        ].join("\n")
    });
    return {
        material: material,
        setPositionsTexture: function (positions) {
            material.uniforms.tPositions.value = positions;
            return this;
        },
        setOriginsTexture: function (origins) {
            material.uniforms.origin.value = origins;
            return this;
        },
        setTimer: function (timer) {
            material.uniforms.timer.value = timer;
            return this;
        }
    }
};
