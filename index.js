var camera, scene, renderer;
var geometry, material, mesh;
 
init();
animate();
 
function init() {
 
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
    camera.position.z = 1;
 
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );
 
    geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    material = new THREE.MeshNormalMaterial();
 
    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    var loader = new THREE.FontLoader();
    loader.load('fonts/helvetiker_regular.typeface.json', function ( font ) {
        var textGeometry = new THREE.TextGeometry("Hello Three.js!", {
            font: font,
            size: 20,
            height: 5,
            curveSegments: 12
        });
        var materials = new THREE.MeshPhongMaterial({color: 0xFF0000});
        var textMesh = new THREE.Mesh(textGeometry, materials);
        scene.add(textMesh);
    } );
 
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth-20, window.innerHeight-25);
    document.body.appendChild( renderer.domElement );
 
    window.addEventListener( 'resize', onWindowResize, false );
}
 
function animate() {
 
    requestAnimationFrame( animate );
 
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
 
    renderer.render( scene, camera );
 
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth-20, window.innerHeight-25 );
}