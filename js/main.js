/**
 * Created by w1 on 9/17/2015.
 */

window.onload = function () {
    var pointSize = 1.0;
    var i, j;
    var container = document.getElementById("container");
    var canvas = document.createElement('canvas');
    var renderer = new THREE.WebGLRenderer({
        canvas: canvas, context: undefined
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50,
        window.innerWidth/window.innerHeight, 1, 1024);
    camera.position.y = 1.5;
    camera.position.z = 4;
    camera.lookAt(scene.position);
    scene.add(camera);
    var light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(0, 100, 0);
    scene.add(light);
    var gl = renderer.domElement.getContext('webgl') ||
        renderer.domElement.getContext('experimental-webgl');
    //gl.enable(gl.POINT_SPRITE);
    //gl.enable(gl.VERTEX_PROGRAM_POINT_SIZE);
    //gl.enable(0x8642);
    if( !renderer.context.getExtension('OES_texture_float')) {
        alert('OES_texture_float is not supported.');
    }

    var textGeo = new THREE.TextGeometry("revo-vr", {
        size: 1.0,
        height: 0.2,
        curveSegments: 0,
        font: "helvetiker",
        weight: "bold",
        style: "normal"
    });
    textGeo.computeBoundingBox();
    var bounds = textGeo.boundingBox;
    textGeo.applyMatrix(
        new THREE.Matrix4().makeTranslation(
            (bounds.max.x - bounds.min.x) * -0.5,
            (bounds.max.y - bounds.min.y) * -0.5,
            (bounds.max.z - bounds.min.z) * -0.5
        )
    );

    var width = 512, height = 1024;
    var points = w1.utils.randomPointInGeometry(textGeo, width * height);
    var data = new Float32Array(width * height * 4);
    for(i = 0, j = 0; i < data.length; i += 4, j += 1) {
        data[i] = points[j].x;
        data[i+1] = points[j].y;
        data[i+2] = points[j].z;
        data[i+3] = 0.0;
    }
    var texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    var rt1 = new THREE.WebGLRenderTarget(width, height, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        stencilBuffer: false
    });
    var rt2 = rt1.clone();
    var gpgpu = new w1.gpgpu(renderer);
    var simulationShader = new w1.gpgpu.simulationShader();
    simulationShader.setOriginsTexture(texture);

    var geometry = new THREE.Geometry();
    for (i = 0; i < width * height; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = (i % width) / width;
        vertex.y = Math.floor(i / width) / height;
        geometry.vertices.push(vertex);
    }
    var material = new THREE.ShaderMaterial({
        uniforms: {
            "map": {type: "t", value: rt1},
            "width": {type: "f", value: width},
            "height": {type: "f", value: height},
            "pointSize": {type: "f", value: pointSize}
        },
        vertexShader: [
            "uniform sampler2D map;",
            "uniform float width;",
            "uniform float height;",
            "uniform float pointSize;",
            "varying vec2 vUv;",
            "varying vec4 vPosition;",
            "void main(){",
            "vUv = position.xy + vec2(0.5/width, 0.5/height);",
            "vec3 color = texture2D(map, vUv).rgb;",
            "gl_PointSize = pointSize;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(color, 1.0);",
            "}"
        ].join("\n"),
        fragmentShader: [
            "uniform sampler2D map;",
            "varying vec2 vUv;",
            "varying vec4 vPosition;",
            "void main() {",
            "float depth = smoothstep(10.24, 1.0, gl_FragCoord.z / gl_FragCoord.w);",
            "vec3 color = texture2D(map, vUv).xyz;",
            "color.r = color.r * 0.2;",
            "color.g = color.g * 0.2 + 0.2;",
            "color.b = color.b * 1.5;",
            "gl_FragColor = vec4( color, depth);",
            "}"
        ].join("\n"),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        transparent: true
    });
    var mesh = new THREE.Points(geometry, material);
    scene.add(mesh);

    var timer = 0;
    var count = 0;
    function render() {
        requestAnimationFrame(render);
        timer += 0.004;
        simulationShader.setTimer(timer);
        if (count % 2 == 0) {
            gpgpu.pass(simulationShader.setPositionsTexture(rt1), rt2);
            material.uniforms.map.value = rt1;
        } else {
            gpgpu.pass(simulationShader.setPositionsTexture(rt2), rt1);
            material.uniforms.map.value = rt2;
        }
        material.needsUpdate = true;
        renderer.render(scene, camera);
        //console.log(timer);
        count += 1;
    }
    render();
};