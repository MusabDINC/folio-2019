import * as THREE from 'three'
import CANNON from 'cannon'

export default class Bicycle
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.controls = _options.controls
        this.sounds = _options.sounds
        this.renderer = _options.renderer
        this.camera = _options.camera
        this.debug = _options.debug
        this.config = _options.config

        // Set up
        this.container = new THREE.Object3D()
        this.position = new THREE.Vector3()

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('bicycle')
            // this.debugFolder.open()
        }

        this.setChassis()
        this.setMovement()
        this.setWheels()
    }

    setChassis()
    {
        // Basit bisiklet şasisi (geçici model)
        this.chassis = {}
        this.chassis.offset = new THREE.Vector3(0, 0, -0.28)
        
        // Car modeli geçici olarak kullanılıyor - normalde bisiklet modeli yüklenecek
        const carModel = this.resources.items.carDefaultChassis
        this.chassis.object = this.objects.getConvertedMesh(carModel.scene.children)
        
        // Bisiklet daha küçük olacak şekilde ölçeklendir
        this.chassis.object.scale.set(0.7, 0.7, 0.7)
        
        // Şasinin rengini değiştir
        for(const child of this.chassis.object.children) {
            if(child.material) {
                child.material = this.materials.pures.items.green.clone()
            }
        }
        
        this.chassis.object.position.copy(this.physics.car.chassis.body.position)
        this.chassis.oldPosition = this.chassis.object.position.clone()
        this.container.add(this.chassis.object)

        this.shadows.add(this.chassis.object, { sizeX: 2, sizeY: 1, offsetZ: 0.1 })

        // Time tick
        this.time.on('tick', () =>
        {
            // Save old position for movement calculation
            this.chassis.oldPosition = this.chassis.object.position.clone()

            // Update position from physics
            this.chassis.object.position.copy(this.physics.car.chassis.body.position).add(this.chassis.offset)
            this.chassis.object.quaternion.copy(this.physics.car.chassis.body.quaternion)
            
            // Bisiklet hareketinde hafif yalpalama ekle
            if(this.movement.localSpeed.x > 0.05) {
                const swayAmount = Math.sin(this.time.elapsed * 0.01) * 0.05
                this.chassis.object.rotation.z += swayAmount
            }

            // Update position
            this.position.copy(this.chassis.object.position)
        })
    }

    setMovement()
    {
        this.movement = {}
        this.movement.speed = new THREE.Vector3()
        this.movement.localSpeed = new THREE.Vector3()
        this.movement.acceleration = new THREE.Vector3()
        this.movement.localAcceleration = new THREE.Vector3()
        this.movement.lastBellTime = 0

        // Zil sesi için klavye dinleyicisi
        window.addEventListener('keydown', (_event) => {
            // H tuşuna basıldığında zil çal
            if(_event.key === 'h' && this.time.elapsed - this.movement.lastBellTime > 500) {
                this.sounds.play('bell')
                this.movement.lastBellTime = this.time.elapsed
            }
        })

        // Time tick
        this.time.on('tick', () =>
        {
            // Movement
            const movementSpeed = new THREE.Vector3()
            movementSpeed.copy(this.chassis.object.position).sub(this.chassis.oldPosition)
            movementSpeed.multiplyScalar(1 / this.time.delta * 17)
            this.movement.acceleration = movementSpeed.clone().sub(this.movement.speed)
            this.movement.speed.copy(movementSpeed)

            this.movement.localSpeed = this.movement.speed.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), - this.chassis.object.rotation.z)
            this.movement.localAcceleration = this.movement.acceleration.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), - this.chassis.object.rotation.z)
            
            // Bisiklet hızına göre ses efekti (rüzgar sesi gibi)
            this.sounds.engine.speed = this.movement.localSpeed.x * 0.7 // Araçtan daha hafif motor sesi
            this.sounds.engine.acceleration = this.controls.actions.up ? 0.3 : 0
        })
    }

    setWheels()
    {
        this.wheels = {}
        
        // Car tekerleğini geçici olarak kullanıyoruz
        this.wheels.object = this.objects.getConvertedMesh(this.resources.items.carDefaultWheel.scene.children)
        this.wheels.items = []

        for(let i = 0; i < 2; i++) // Bisikletin sadece 2 tekerleği var
        {
            const object = this.wheels.object.clone()
            
            // Bisiklet tekerlekleri daha ince
            object.scale.set(0.7, 0.7, 0.4)
            
            this.wheels.items.push(object)
            this.container.add(object)
        }

        // Time tick
        this.time.on('tick', () =>
        {
            // Sadece ön ve arka tekerleği güncelleyelim (indis 0 ve 2)
            // Bisikletin sadece 2 tekerleği olduğundan uygun şekilde ayarla
            for(let i = 0; i < 2; i++)
            {
                const wheelIndex = i * 2; // 0 ve 2 indislerini kullan
                const wheelBody = this.physics.car.wheels.bodies[wheelIndex];
                const wheelObject = this.wheels.items[i];

                wheelObject.position.copy(wheelBody.position);
                wheelObject.quaternion.copy(wheelBody.quaternion);
                
                // Bisiklet tekerleği daha hızlı döner
                wheelObject.rotation.x += this.movement.localSpeed.x * 0.01;
            }
        })
    }
} 