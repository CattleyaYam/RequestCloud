var camera, scene, renderer;
var controls;
var objects = [];
var clock;

var d0 = 60;
var d1 = d0*1.4;
var k0 = 72/(d0*d0);
var m = 1;
var forceCoefficient = 10000;

var circleCenterPos = new THREE.Vector2(2600,6700);
var circleRadius = 100; //1100

//タイトル、投稿回数、currentP,currentV,currentF,half_nextV
var table = [
    ["命に嫌われている",120,new THREE.Vector2(0,10),new THREE.Vector2(),new THREE.Vector2()],
    ["シャルル",160,new THREE.Vector2(0,0),new THREE.Vector2(),new THREE.Vector2()],
    ["シャルル",160,new THREE.Vector2(1,0),new THREE.Vector2(),new THREE.Vector2()],
    ["シャルル",160,new THREE.Vector2(0,2),new THREE.Vector2(),new THREE.Vector2()],
    ["シャルル",160,new THREE.Vector2(0,0),new THREE.Vector2(),new THREE.Vector2()],
    ["シャルル",160,new THREE.Vector2(-2,0),new THREE.Vector2(),new THREE.Vector2()],
    ["シャルル",160,new THREE.Vector2(0,0),new THREE.Vector2(),new THREE.Vector2()],
];


init();
animate();
onWindowResize();
 
function init() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 45000 );
    camera.position.z = 35000;
 
    scene = new THREE.Scene();

    clock = new THREE.Clock();
    
    //bubbles
    for ( var i = 0; i < table.length; i ++ ) {
        var element = document.createElement( 'div' );
        element.className = "element";
        element.style.width = d0+"px";
        element.style.height = d0+"px";
        element.style.fontSize = "1px";
        
        var rand = Math.random();
        if(rand <=0.333) {
            element.style.backgroundColor = 'rgba(255,255,0,0.5)';
        }else if(rand<=0.6666){
            element.style.backgroundColor = 'rgba(255,0,127,0.5)';
        }else{
            element.style.backgroundColor = 'rgba(0,255,255,0.5)';
        }

        var text = document.createElement( 'div' );
        text.className = "text";
        text.innerText = table[i][0];
        element.appendChild(text);

        var object = new THREE.CSS3DObject( element );
        table[i][2].x = circleCenterPos.x;
        table[i][2].y = circleCenterPos.y;
        object.position.x = table[i][2].x;
        object.position.y = table[i][2].y;
        object.position.z = 100;

        scene.add( object );
        objects.push( object );
    }

    //background-image
    var imgElement = document.createElement( 'div' );
    imgElement.className = "imgElement";
    var circleElement = document.createElement( 'div' );
    circleElement.className = "circleElement";
    imgElement.appendChild(circleElement);
    var imgObject = new THREE.CSS3DObject(imgElement);
    imgObject.position.z = -1;
    imgObject.scale.x = 20;
    imgObject.scale.y = 20;
    scene.add(imgObject);

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( window.innerWidth-20, window.innerHeight-25);
    document.body.appendChild( renderer.domElement );

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.minDistance = 1;
    controls.maxDistance = 45000;
    controls.noRotate = true;
    controls.addEventListener( 'change', render );
 
    window.addEventListener( 'resize', onWindowResize, false );
}
 
function animate() {
    requestAnimationFrame( animate );
    render();
    camera.updateProjectionMatrix();
    controls.update();
    updateBubbles();
}

function render() {
    renderer.render( scene, camera );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth-20, window.innerHeight-25 );
    render();
}

//d：２円間の距離
//d0：2円間安定距離（２円の半径の合計）
//d1：2円間の力の距離範囲（bi半径（基準）＋bj直径）
//k0=72/(d0*d0)
function calcBetweenBubbleForce(d, d0, d1, k0) {
    if(d>=0 && d<=d1) {
        var D = k0 * ( (d0*d0*d0-3*d0*d1*d1+2*d1*d1*d1) / (d0*(d1*d1*d1-d0*d1*d1)) )
        var C = 0;
        var B = D * ( (d0*d0*d0-d1*d1*d1) / (d0*d0*(d1*d1*d1-d0*d1*d1)) );
        var A = D * ( (d1*d1-d0*d0) / (d0*d0*(d1*d1*d1-d0*d1*d1)) );
        return (A*d*d*d + B*d*d + C*d + D);
    }else{
        return 0;
    }
}


function updateBubbles() {
    var delta = clock.getDelta();

    for ( var i = 0; i < table.length; i++ ) {
        
        //力計算
        var currentF = new THREE.Vector2();
        for ( var j = 0; j < table.length; j++ ) {
            var currentPi = table[i][2];
            if(i!=j) {
                var currentPj = table[j][2];
                var jtoi = new THREE.Vector2(currentPi.x-currentPj.x, currentPi.y-currentPj.y);
                var d = jtoi.length();
                jtoi.normalize();
                var forceMagni = calcBetweenBubbleForce(d,d0,d1,k0)*forceCoefficient;
                jtoi.multiplyScalar(forceMagni);
                currentF.x += jtoi.x;
                currentF.y += jtoi.y;
            }
        }

        //速度の更新１
        //var viscosityCoefficient = 0.707*2*Math.pow(-m*currentF.length()/(d0/2),0.5); //半径が異なる場合は、(d0/2)の部分を変える必要あり
        var viscosityCoefficient = 0.707;
        var currentV = table[i][3];
        var half_nextV = new THREE.Vector2(
            currentV.x*(2*m-delta*viscosityCoefficient)/(2*m+delta*viscosityCoefficient) + currentF.x*(delta/(2*m+delta*viscosityCoefficient)),
            currentV.y*(2*m-delta*viscosityCoefficient)/(2*m+delta*viscosityCoefficient) + currentF.y*(delta/(2*m+delta*viscosityCoefficient))
        );

        //位置の更新
        var currentP = table[i][2];
        var nextP = new THREE.Vector2(
            currentP.x + half_nextV.x * (delta*(2*m+delta*viscosityCoefficient)) / (2*m),
            currentP.y + half_nextV.y * (delta*(2*m+delta*viscosityCoefficient)) / (2*m)
        );
        //console.log(nextP);

        //力の更新
        var nextF = new THREE.Vector2();
        for ( var j = 0; j < table.length; j++ ) {
            if(i!=j) {
                var currentPj = table[j][2];
                var jtoi = new THREE.Vector2(nextP.x-currentPj.x, nextP.y-currentPj.y);
                var d = jtoi.length();
                jtoi.normalize();
                var forceMagni = calcBetweenBubbleForce(d,d0,d1,k0)*forceCoefficient;
                jtoi.multiplyScalar(forceMagni);
                nextF.x += jtoi.x;
                nextF.y += jtoi.y;

                if(d<=0.00001){
                    var tmp = new THREE.Vector2(2*Math.random()-1, 2*Math.random()-1);
                    tmp.normalize();
                    nextF.x += tmp.x*0.00001;
                    nextF.y += tmp.y*0.00001;
                }
            }
        }

        //速度の更新２
        var nextV = new THREE.Vector2(
            half_nextV.x + nextF.x * (delta/(2*m+delta*viscosityCoefficient)),
            half_nextV.y + nextF.y * (delta/(2*m+delta*viscosityCoefficient))
        );

        //一定範囲に収まるように位置と速度を修正
        var centerToNextP = new THREE.Vector2(nextP.x-circleCenterPos.x, nextP.y-circleCenterPos.y);
        var ctoPLength = centerToNextP.length();
        if(ctoPLength >= circleRadius) {
            centerToNextP.normalize();
            var invV = new THREE.Vector2(-centerToNextP.x, -centerToNextP.y);
            invV.normalize();
            invV.multiplyScalar(nextV.length()*0.1);
            nextV.x = invV.x;
            nextV.y = invV.y;

            centerToNextP.multiplyScalar(circleRadius);
            nextP.x = circleCenterPos.x+centerToNextP.x;
            nextP.y = circleCenterPos.y+centerToNextP.y;
        }

        table[i][2].x = nextP.x;
        table[i][2].y = nextP.y;
        table[i][3].x = nextV.x;
        table[i][3].y = nextV.y;
        table[i][4].x = nextF.x;
        table[i][4].y = nextF.y;
        objects[i].position.x = nextP.x;
        objects[i].position.y = nextP.y;
    }
}