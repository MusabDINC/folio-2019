import * as THREE from 'three'
import CANNON from 'cannon'

export default class Forklift
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
            this.debugFolder = this.debug.addFolder('forklift')
            // this.debugFolder.open()
        }

        this.setChassis()
        this.setMovement()
        this.setWheels()
        this.setForks()
    }

    setChassis()
    {
        // Forklift şasisi (geçici model)
        this.chassis = {}
        this.chassis.offset = new THREE.Vector3(0, 0, -0.28)
        
        // Car modeli geçici olarak kullanılıyor - normalde forklift modeli yüklenecek
        const carModel = this.resources.items.carDefaultChassis
        this.chassis.object = this.objects.getConvertedMesh(carModel.scene.children)
        
        // Forklift daha ağır gözüksün
        this.chassis.object.scale.set(0.9, 0.9, 1.1)
        
        // Şasinin rengini değiştir - sarı tipik forklift rengi
        for(const child of this.chassis.object.children) {
            if(child.material) {
                child.material = this.materials.pures.items.yellow.clone()
            }
        }
        
        this.chassis.object.position.copy(this.physics.car.chassis.body.position)
        this.chassis.oldPosition = this.chassis.object.position.clone()
        this.container.add(this.chassis.object)

        this.shadows.add(this.chassis.object, { sizeX: 3, sizeY: 2, offsetZ: 0.2 })

        // Time tick
        this.time.on('tick', () =>
        {
            // Save old position for movement calculation
            this.chassis.oldPosition = this.chassis.object.position.clone()

            // Update position from physics
            this.chassis.object.position.copy(this.physics.car.chassis.body.position).add(this.chassis.offset)
            this.chassis.object.quaternion.copy(this.physics.car.chassis.body.quaternion)

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

            // Forklift benzeri motor sesi
            this.sounds.engine.speed = this.movement.localSpeed.x * 0.5 // Daha yavaş ve ağır motor sesi
            this.sounds.engine.acceleration = this.controls.actions.up ? 0.4 : 0
            
            // Çatallar hareket ettiğinde hidrolik ses efekti
            if(this.forks.isMoving) {
                // Hidrolik sesini çal
            }
        })
    }

    setWheels()
    {
        this.wheels = {}
        this.wheels.object = this.objects.getConvertedMesh(this.resources.items.carDefaultWheel.scene.children)
        this.wheels.items = []

        for(let i = 0; i < 4; i++)
        {
            const object = this.wheels.object.clone()
            
            // Forkliftin arka tekerleri daha küçük
            if(i >= 2) {
                object.scale.set(0.7, 0.7, 1.0)
            } else {
                // Ön tekerlekler daha geniş
                object.scale.set(1.0, 1.0, 1.2)
            }
            
            this.wheels.items.push(object)
            this.container.add(object)
        }

        // Time tick
        this.time.on('tick', () =>
        {
            for(const _wheelKey in this.physics.car.wheels.bodies)
            {
                const wheelBody = this.physics.car.wheels.bodies[_wheelKey]
                const wheelObject = this.wheels.items[_wheelKey]

                wheelObject.position.copy(wheelBody.position)
                wheelObject.quaternion.copy(wheelBody.quaternion)
            }
        })
    }
    
    setForks()
    {
        // Forklift çatalları
        this.forks = {}
        this.forks.height = 0 // Çatalların yüksekliği (0-1 aralığında)
        this.forks.isMoving = false
        this.forks.targetHeight = 0
        this.forks.lastHydraulicSound = 0 // Son hidrolik ses çalma zamanı
        
        // Çatal geometrisi
        const forkGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.05)
        const forkMaterial = this.materials.pures.items.grey.clone()
        
        // Sol çatal
        this.forks.leftFork = new THREE.Mesh(forkGeometry, forkMaterial)
        this.forks.leftFork.position.set(1.2, -0.3, 0)
        
        // Sağ çatal
        this.forks.rightFork = new THREE.Mesh(forkGeometry, forkMaterial)
        this.forks.rightFork.position.set(1.2, 0.3, 0)
        
        // Çatal taşıyıcı
        const carrierGeometry = new THREE.BoxGeometry(0.1, 1, 0.5)
        this.forks.carrier = new THREE.Mesh(carrierGeometry, forkMaterial)
        this.forks.carrier.position.set(0.5, 0, 0)
        
        // Direk
        const poleGeometry = new THREE.BoxGeometry(0.1, 0.1, 1.5)
        this.forks.pole = new THREE.Mesh(poleGeometry, forkMaterial)
        this.forks.pole.position.set(0.4, 0, 0.5)
        
        // Grup oluştur
        this.forks.group = new THREE.Group()
        this.forks.group.add(this.forks.leftFork)
        this.forks.group.add(this.forks.rightFork)
        this.forks.group.add(this.forks.carrier)
        this.forks.group.add(this.forks.pole)
        
        // Şasiye bağla
        this.chassis.object.add(this.forks.group)
        
        // Kontroller için klavye dinleyicisi
        window.addEventListener('keydown', (_event) => {
            // E tuşu - çatalları yukarı kaldır
            if(_event.key === 'e') {
                this.forks.targetHeight = Math.min(1, this.forks.targetHeight + 0.1)
                this.forks.isMoving = true
                this.playHydraulicSound()
            }
            // Q tuşu - çatalları aşağı indir
            else if(_event.key === 'q') {
                this.forks.targetHeight = Math.max(0, this.forks.targetHeight - 0.1)
                this.forks.isMoving = true
                this.playHydraulicSound()
            }
        })
        
        // Time tick
        this.time.on('tick', () => {
            // Çatalların yüksekliğini hedef değere doğru hareket ettir
            if(this.forks.height !== this.forks.targetHeight) {
                const step = 0.01
                
                if(Math.abs(this.forks.height - this.forks.targetHeight) < step) {
                    this.forks.height = this.forks.targetHeight
                    this.forks.isMoving = false
                } else if(this.forks.height < this.forks.targetHeight) {
                    this.forks.height += step
                    // Periyodik olarak hidrolik ses çal
                    this.playHydraulicSound()
                } else {
                    this.forks.height -= step
                    // Periyodik olarak hidrolik ses çal
                    this.playHydraulicSound()
                }
                
                // Çatal grubunun yüksekliğini güncelle
                this.forks.group.position.z = this.forks.height * 0.5
            }
        })
    }
    
    /**
     * Hidrolik ses çalma fonksiyonu
     * Çok sık tekrarlanmaması için zaman kontrolü yapılır
     */
    playHydraulicSound() {
        // En az 300ms aralıklarla ses çal
        if(this.time.elapsed - this.forks.lastHydraulicSound > 300) {
            this.sounds.play('hydraulic')
            this.forks.lastHydraulicSound = this.time.elapsed
        }
    }
} 