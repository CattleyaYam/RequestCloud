var camera, scene, renderer;
var controls;
var bubbles = [];
var clock;

var circleCenterPos = new THREE.Vector2(2600,6700);
var circleRadius = 1100;
var mass = 1;
var viscosity = 0.001016;
var springConst = (viscosity*viscosity) / (4*mass*0.707*0.707);
var r = 30;
var d0 = r*2;
var d1 = d0 * 1.4;
var offset = 100000000000000;

class Bubble {
    constructor(text, count, position, velocity) {
        //parameter
        this.count = count;
        this.position = position;
        this.velocity = velocity;

        //css3dobject
        this.element = document.createElement('div');
        var rand = Math.random();
        if(rand <=0.333) {
            this.element.className = "bubbleBaseYellow";
        }else if(rand<=0.6666){
            this.element.className = "bubbleBaseMagenta";
        }else{
            this.element.className = "bubbleBaseCyan";
        }
        this.textElement = document.createElement('div');
        this.textElement.className = "text";
        this.textElement.innerText = text;
        this.textElement.style.fontSize = "1px";
        this.element.appendChild(this.textElement);
        this.css3dobject = new THREE.CSS3DObject( this.element );
        this.css3dobject.position.x = position.x;
        this.css3dobject.position.y = position.y;
        this.css3dobject.position.z = 10;
    }

    getCSS3DObject() {
        return this.css3dobject;
    }

    getPosition(){
        return this.position;
    }

    getVelocity(){
        return this.velocity;
    }

    setPosition(position) {
        this.css3dobject.position.x = position.x;
        this.css3dobject.position.y = position.y;
        this.position.x = position.x;
        this.position.y = position.y;
    }

    setVelosity(velocity){
        this.velocity.x = velocity.x;
        this.velocity.x = velocity.y;
    }
}

init();
animate();
onWindowResize();
 
function init() {
    camera = new THREE.PerspectiveCamera( 45, document.documentElement.clientWidth / document.documentElement.clientHeight, 1, 45000 );
    camera.position.z = 35000;
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );
    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.minDistance = 1;
    controls.maxDistance = 45000;
    controls.noRotate = true;
    controls.addEventListener( 'change', render );
    window.addEventListener( 'resize', onWindowResize, false );
    renderer.domElement.addEventListener( 'mousedown', onMouseDown);

    //Bubble
    for(var i=0; i<50; i++) {
        var bubble = new Bubble("TEST", 1, new THREE.Vector2(),new THREE.Vector2());
        var bubblePos = new THREE.Vector2( circleCenterPos.x+(Math.random()*100-50), circleCenterPos.y+(Math.random()*100-50) );
        bubble.setPosition(bubblePos);
        scene.add(bubble.getCSS3DObject());
        bubbles.push(bubble);
    }

    //Background-image
    var imgElement = document.createElement( 'div' );
    imgElement.className = "imgElement";
    var circleElement = document.createElement( 'div' );
    circleElement.className = "circle";
    imgElement.appendChild(circleElement);
    var imgObject = new THREE.CSS3DObject(imgElement);
    imgObject.position.z = -1;
    imgObject.scale.x = 20;
    imgObject.scale.y = 20;
    scene.add(imgObject);
}
 
function animate() {
    requestAnimationFrame( animate );
    camera.updateProjectionMatrix();
    controls.update();
    updateBubbles();
}

function render() {
    renderer.render( scene, camera );
}

function onWindowResize() {
    camera.aspect = document.documentElement.clientWidth / document.documentElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( document.documentElement.clientWidth, document.documentElement.clientHeight );
    render();
}

function onMouseDown() {
    for(var i=0; i<10; i++) {
        var bubble = new Bubble("TEST", 1, new THREE.Vector2(),new THREE.Vector2());
        var bubblePos = new THREE.Vector2( circleCenterPos.x+(Math.random()*100-50), circleCenterPos.y+(Math.random()*100-50) );
        bubble.setPosition(bubblePos);
        scene.add(bubble.getCSS3DObject());
        bubbles.push(bubble);
        console.log("test");
    }
}

function calcBetweenBubbleForce( d ) {
    if(d>=0 && d<=d1) {
        var D = springConst * ( (d0*d0*d0-3*d0*d1*d1+2*d1*d1*d1) / (d0*(d1*d1*d1-d0*d1*d1)) )
        var C = 0;
        var B = D * ( (d0*d0*d0-d1*d1*d1) / (d0*d0*(d1*d1*d1-d0*d1*d1)) );
        var A = D * ( (d1*d1-d0*d0) / (d0*d0*(d1*d1*d1-d0*d1*d1)) );
        return (A*d*d*d + B*d*d + C*d + D);
    }else{
        return 0;
    }
}

function updateBubbles() {
    var dt = clock.getDelta()*0.1;

    for(var i=0; i<bubbles.length; i++) {
        
        //合力
        var currentPi = bubbles[i].getPosition();
        var currentF = new THREE.Vector2();
        for ( var j = 0; j < bubbles.length; j++ ) {
            if(i!=j) {
                var currentPj = bubbles[j].getPosition();
                var jtoi = new THREE.Vector2(currentPi.x-currentPj.x, currentPi.y-currentPj.y);
                var d = jtoi.length();
                jtoi.normalize();
                var forceMagni = calcBetweenBubbleForce(d)*offset;
                jtoi.multiplyScalar(forceMagni);
                currentF.x += jtoi.x;
                currentF.y += jtoi.y;
            }
        }
        
        //速度の更新１
        var currentV = bubbles[i].getVelocity();
        var half_nextV = new THREE.Vector2(
            currentV.x*(2*mass-dt*viscosity)/(2*mass+dt*viscosity) + currentF.x*(dt/(2*mass+dt*viscosity)),
            currentV.y*(2*mass-dt*viscosity)/(2*mass+dt*viscosity) + currentF.y*(dt/(2*mass+dt*viscosity))
        );

        //位置の更新
        var nextP = new THREE.Vector2(
            currentPi.x + half_nextV.x * (dt*(2*mass+dt*viscosity)) / (2*mass),
            currentPi.y + half_nextV.y * (dt*(2*mass+dt*viscosity)) / (2*mass)
        );

        //力の更新
        var nextF = new THREE.Vector2();
        for (var j = 0; j < bubbles.length; j++ ) {
            if(i!=j) {
                var currentPj = bubbles[j].getPosition();
                var jtoi = new THREE.Vector2(nextP.x-currentPj.x, nextP.y-currentPj.y);
                var d = jtoi.length();
                jtoi.normalize();
                var forceMagni = calcBetweenBubbleForce(d)*offset;
                jtoi.multiplyScalar(forceMagni);
                nextF.x += jtoi.x;
                nextF.y += jtoi.y;
            }
        }

        //速度の更新２
        var nextV = new THREE.Vector2(
            half_nextV.x + nextF.x * (dt/(2*mass+dt*viscosity)),
            half_nextV.y + nextF.y * (dt/(2*mass+dt*viscosity))
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

        bubbles[i].setPosition( nextP );
        bubbles[i].setVelosity( nextV );

    }
}