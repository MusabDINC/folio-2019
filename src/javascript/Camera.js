import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

export default class Camera
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.sizes = _options.sizes
        this.renderer = _options.renderer
        this.debug = _options.debug
        this.config = _options.config

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.target = new THREE.Vector3(0, 0, 0)
        this.targetEased = new THREE.Vector3(0, 0, 0)
        this.easing = 0.15

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('camera')
            // this.debugFolder.open()
        }

        this.setAngle()
        this.setInstance()
        this.setZoom()
        this.setPan()
        this.setOrbitControls()
        this.setCameraModes()
    }

    setAngle()
    {
        // Set up
        this.angle = {}

        // Items
        this.angle.items = {
            default: new THREE.Vector3(1.135, - 1.45, 1.15),
            projects: new THREE.Vector3(0.38, - 1.4, 1.63)
        }

        // Value
        this.angle.value = new THREE.Vector3()
        this.angle.value.copy(this.angle.items.default)

        // Set method
        this.angle.set = (_name) =>
        {
            const angle = this.angle.items[_name]
            if(typeof angle !== 'undefined')
            {
                gsap.to(this.angle.value, { ...angle, duration: 2, ease: 'power1.inOut' })
            }
        }

        // Debug
        if(this.debug)
        {
            this.debugFolder.add(this, 'easing').step(0.0001).min(0).max(1).name('easing')
            this.debugFolder.add(this.angle.value, 'x').step(0.001).min(- 2).max(2).name('invertDirectionX').listen()
            this.debugFolder.add(this.angle.value, 'y').step(0.001).min(- 2).max(2).name('invertDirectionY').listen()
            this.debugFolder.add(this.angle.value, 'z').step(0.001).min(- 2).max(2).name('invertDirectionZ').listen()
        }
    }

    setInstance()
    {
        // Set up
        this.instance = new THREE.PerspectiveCamera(40, this.sizes.viewport.width / this.sizes.viewport.height, 1, 80)
        this.instance.up.set(0, 0, 1)
        this.instance.position.copy(this.angle.value)
        this.instance.lookAt(new THREE.Vector3())
        this.container.add(this.instance)

        // RC kamera için tilt/eğim değerleri
        this.rcCameraTilt = {
            current: 0,
            target: 0,
            easing: 0.05,
            max: Math.PI * 0.05 // maksimum 5 derece eğim
        }
        
        // RC kamera titreşimi için değerler
        this.rcCameraShake = {
            enabled: true,
            intensity: 0.002, // titreşim yoğunluğu
            speedFactor: 0, // hıza bağlı faktör
            xNoise: Math.random() * 1000, // rastgele başlangıç değerleri
            yNoise: Math.random() * 1000,
            zNoise: Math.random() * 1000
        }
        
        // RC kamera offset (kaputun tam üstünde olması için)
        this.rcCameraOffset = new THREE.Vector3(0, 0, 0)

        // Resize event
        this.sizes.on('resize', () =>
        {
            this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height
            this.instance.updateProjectionMatrix()
        })

        // Time tick
        this.time.on('tick', () =>
        {
            if(!this.orbitControls.enabled)
            {
                this.targetEased.x += (this.target.x - this.targetEased.x) * this.easing
                this.targetEased.y += (this.target.y - this.targetEased.y) * this.easing
                this.targetEased.z += (this.target.z - this.targetEased.z) * this.easing

                // Apply zoom
                this.instance.position.copy(this.targetEased).add(this.angle.value.clone().normalize().multiplyScalar(this.zoom.distance))

                // Look at target
                this.instance.lookAt(this.targetEased)

                // RC kamera efekti için - 1. şahıs moddaysa ve araba varsa
                if (this.activeMode === 'firstPerson') {
                    // Arabayı al (window.application.world.car'a erişebiliriz)
                    const car = window.application?.world?.car;
                    
                    if (car && car.chassis) {
                        // Arabadan dönüş verisini al (yatay dönüş açısı - z ekseni etrafında)
                        const rotation = car.chassis.object.rotation.z;
                        
                        // Araç fizikleri ve hareket verilerini al
                        const turnSpeed = car.movement?.localAcceleration?.y || 0;
                        const forwardSpeed = Math.abs(car.movement?.localSpeed?.x || 0);
                        
                        // Dönüş hızına göre kamera eğimi - viraj efekti
                        this.rcCameraTilt.target = -turnSpeed * 0.4; // dönüşün tersi yönünde daha güçlü eğim
                        
                        // Eğim değerini sınırla
                        this.rcCameraTilt.target = Math.max(
                            -this.rcCameraTilt.max, 
                            Math.min(this.rcCameraTilt.max, this.rcCameraTilt.target)
                        );
                        
                        // Eğim değerini yumuşat
                        this.rcCameraTilt.current += (this.rcCameraTilt.target - this.rcCameraTilt.current) * this.rcCameraTilt.easing;
                        
                        // Titreşim yoğunluğunu hıza göre ayarla (motor titreşim efekti)
                        this.rcCameraShake.speedFactor = Math.min(forwardSpeed * 0.1, 1.0);
                        
                        // Perlin noise benzeri bir efekt ile rastgele titreşim ekle (motor titreşim efekti)
                        if (this.rcCameraShake.enabled && this.rcCameraShake.speedFactor > 0.1) {
                            // Zamanla ilerleyen gürültü değerleri
                            this.rcCameraShake.xNoise += 0.01;
                            this.rcCameraShake.yNoise += 0.01;
                            this.rcCameraShake.zNoise += 0.007;
                            
                            // Sinüs fonksiyonlarını kullanarak doğal titreşim efekti
                            const shakeX = Math.sin(this.rcCameraShake.xNoise) * this.rcCameraShake.intensity * this.rcCameraShake.speedFactor;
                            const shakeY = Math.sin(this.rcCameraShake.yNoise) * this.rcCameraShake.intensity * this.rcCameraShake.speedFactor;
                            const shakeZ = Math.sin(this.rcCameraShake.zNoise) * this.rcCameraShake.intensity * this.rcCameraShake.speedFactor;
                            
                            // Titreşimi kamera pozisyonuna uygula
                            this.instance.position.x += shakeX;
                            this.instance.position.y += shakeY;
                            this.instance.position.z += shakeZ;
                        }
                        
                        // Kamerayı araba şasisi pozisyonuna yerleştir
                        this.instance.position.copy(car.chassis.object.position);
                        
                        // Kaput üzerindeki pozisyonu ayarla - kaputun tam üstünde olması için
                        // RC Camera pozisyon düzeltmesi (kaputun tam üstünde)
                        this.rcCameraOffset.set(0.63, 0, 0.52); // X: Daha öne (kaputa doğru), Z: Daha yukarı
                        
                        // Offset'i aracın dönüşüne göre döndür
                        this.rcCameraOffset.applyQuaternion(car.chassis.object.quaternion);
                        
                        // Ofset'i uygulamadan önce, şasi offset'ini ekle
                        if (car.chassis.offset) {
                            this.instance.position.add(car.chassis.offset);
                        }
                        
                        // Offset'i uygula 
                        this.instance.position.add(this.rcCameraOffset);
                        
                        // Kameranın bakış yönünü ayarla (araba ön kısmı yönünde)
                        const lookAtTarget = car.chassis.object.position.clone();
                        // Bakış noktasını arabanın önüne doğru kaydır
                        const lookDirection = new THREE.Vector3(1, 0, 0); // Aracın ön yönü
                        lookDirection.applyQuaternion(car.chassis.object.quaternion);
                        lookDirection.multiplyScalar(10); // Bakış yönünde uzağa bak
                        
                        lookAtTarget.add(lookDirection);
                        lookAtTarget.add(car.chassis.offset); // Şasi offset'ini ekle
                        
                        // Kamerayı bakış noktasına yönelt
                        this.instance.lookAt(lookAtTarget);
                        
                        // Sadece viraj eğimini ekle (x ekseni etrafında eğim)
                        this.instance.rotation.x += this.rcCameraTilt.current; // Viraj eğimini ekle
                        
                        // Araç hızına göre hafif FOV (Field of View) efekti - hızlandıkça görüş açısı genişler
                        const baseFOV = 40;
                        const speedFactor = forwardSpeed * 0.4; // daha az baskın bir hız efekti
                        this.instance.fov = baseFOV + speedFactor;
                        this.instance.updateProjectionMatrix();
                    }
                }

                // Apply pan - 1. şahıs modda pan'ı uygulamıyoruz
                if (this.activeMode !== 'firstPerson') {
                    this.instance.position.x += this.pan.value.x
                    this.instance.position.y += this.pan.value.y
                }
            }
        })
    }

    setZoom()
    {
        // Set up
        this.zoom = {}
        this.zoom.easing = 0.1
        this.zoom.minDistance = 14
        this.zoom.amplitude = 15
        this.zoom.value = this.config.cyberTruck ? 0.3 : 0.5
        this.zoom.targetValue = this.zoom.value
        this.zoom.distance = this.zoom.minDistance + this.zoom.amplitude * this.zoom.value

        // Listen to mousewheel event
        document.addEventListener('mousewheel', (_event) =>
        {
            this.zoom.targetValue += _event.deltaY * 0.001
            this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
        }, { passive: true })

        // Touch
        this.zoom.touch = {}
        this.zoom.touch.startDistance = 0
        this.zoom.touch.startValue = 0

        this.renderer.domElement.addEventListener('touchstart', (_event) =>
        {
            if(_event.touches.length === 2)
            {
                this.zoom.touch.startDistance = Math.hypot(_event.touches[0].clientX - _event.touches[1].clientX, _event.touches[0].clientX - _event.touches[1].clientX)
                this.zoom.touch.startValue = this.zoom.targetValue
            }
        })

        this.renderer.domElement.addEventListener('touchmove', (_event) =>
        {
            if(_event.touches.length === 2)
            {
                _event.preventDefault()

                const distance = Math.hypot(_event.touches[0].clientX - _event.touches[1].clientX, _event.touches[0].clientX - _event.touches[1].clientX)
                const ratio = distance / this.zoom.touch.startDistance

                this.zoom.targetValue = this.zoom.touch.startValue - (ratio - 1)
                this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
            }
        })

        // Time tick event
        this.time.on('tick', () =>
        {
            this.zoom.value += (this.zoom.targetValue - this.zoom.value) * this.zoom.easing
            this.zoom.distance = this.zoom.minDistance + this.zoom.amplitude * this.zoom.value
        })
    }

    setPan()
    {
        // Set up
        this.pan = {}
        this.pan.enabled = false
        this.pan.active = false
        this.pan.easing = 0.1
        this.pan.start = {}
        this.pan.start.x = 0
        this.pan.start.y = 0
        this.pan.value = {}
        this.pan.value.x = 0
        this.pan.value.y = 0
        this.pan.targetValue = {}
        this.pan.targetValue.x = this.pan.value.x
        this.pan.targetValue.y = this.pan.value.y
        this.pan.raycaster = new THREE.Raycaster()
        this.pan.mouse = new THREE.Vector2()
        this.pan.needsUpdate = false
        this.pan.hitMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, visible: false })
        )
        this.container.add(this.pan.hitMesh)

        this.pan.reset = () =>
        {
            this.pan.targetValue.x = 0
            this.pan.targetValue.y = 0
        }

        this.pan.enable = () =>
        {
            this.pan.enabled = true

            // Update cursor
            this.renderer.domElement.classList.add('has-cursor-grab')
        }

        this.pan.disable = () =>
        {
            this.pan.enabled = false

            // Update cursor
            this.renderer.domElement.classList.remove('has-cursor-grab')
        }

        this.pan.down = (_x, _y) =>
        {
            if(!this.pan.enabled)
            {
                return
            }

            // Update cursor
            this.renderer.domElement.classList.add('has-cursor-grabbing')

            // Activate
            this.pan.active = true

            // Update mouse position
            this.pan.mouse.x = (_x / this.sizes.viewport.width) * 2 - 1
            this.pan.mouse.y = - (_y / this.sizes.viewport.height) * 2 + 1

            // Get start position
            this.pan.raycaster.setFromCamera(this.pan.mouse, this.instance)

            const intersects = this.pan.raycaster.intersectObjects([this.pan.hitMesh])

            if(intersects.length)
            {
                this.pan.start.x = intersects[0].point.x
                this.pan.start.y = intersects[0].point.y
            }
        }

        this.pan.move = (_x, _y) =>
        {
            if(!this.pan.enabled)
            {
                return
            }

            if(!this.pan.active)
            {
                return
            }

            this.pan.mouse.x = (_x / this.sizes.viewport.width) * 2 - 1
            this.pan.mouse.y = - (_y / this.sizes.viewport.height) * 2 + 1

            this.pan.needsUpdate = true
        }

        this.pan.up = () =>
        {
            // Deactivate
            this.pan.active = false

            // Update cursor
            this.renderer.domElement.classList.remove('has-cursor-grabbing')
        }

        // Mouse
        window.addEventListener('mousedown', (_event) =>
        {
            this.pan.down(_event.clientX, _event.clientY)
        })

        window.addEventListener('mousemove', (_event) =>
        {
            this.pan.move(_event.clientX, _event.clientY)
        })

        window.addEventListener('mouseup', () =>
        {
            this.pan.up()
        })

        // Touch
        this.renderer.domElement.addEventListener('touchstart', (_event) =>
        {
            if(_event.touches.length === 1)
            {
                this.pan.down(_event.touches[0].clientX, _event.touches[0].clientY)
            }
        })

        this.renderer.domElement.addEventListener('touchmove', (_event) =>
        {
            if(_event.touches.length === 1)
            {
                this.pan.move(_event.touches[0].clientX, _event.touches[0].clientY)
            }
        })

        this.renderer.domElement.addEventListener('touchend', () =>
        {
            this.pan.up()
        })

        // Time tick event
        this.time.on('tick', () =>
        {
            // If active
            if(this.pan.active && this.pan.needsUpdate)
            {
                // Update target value
                this.pan.raycaster.setFromCamera(this.pan.mouse, this.instance)

                const intersects = this.pan.raycaster.intersectObjects([this.pan.hitMesh])

                if(intersects.length)
                {
                    this.pan.targetValue.x = - (intersects[0].point.x - this.pan.start.x)
                    this.pan.targetValue.y = - (intersects[0].point.y - this.pan.start.y)
                }

                // Update needsUpdate
                this.pan.needsUpdate = false
            }

            // Update value and apply easing
            this.pan.value.x += (this.pan.targetValue.x - this.pan.value.x) * this.pan.easing
            this.pan.value.y += (this.pan.targetValue.y - this.pan.value.y) * this.pan.easing
        })
    }

    setOrbitControls()
    {
        // Set up
        this.orbitControls = new OrbitControls(this.instance, this.renderer.domElement)
        this.orbitControls.enabled = false
        this.orbitControls.enableKeys = false
        this.orbitControls.zoomSpeed = 0.5

        // Debug
        if(this.debug)
        {
            this.debugFolder.add(this.orbitControls, 'enabled').name('orbitControlsEnabled')
        }
    }

    /**
     * Kamera modlarını ayarla
     */
    setCameraModes() {
        // Kamera modları
        this.modes = {
            thirdPerson: {
                active: true,
                angle: this.angle.value.clone(),
                easing: this.easing,
                distance: this.zoom.minDistance,
                height: 0
            },
            firstPerson: {
                active: false,
                angle: new THREE.Vector3(0, 0, 0), // Düz bakış açısı
                easing: 0.1,
                distance: 0.1, // Araç ile kamera arasında çok az mesafe
                height: 0.5 // Kaput yüksekliği
            },
            free: {
                active: false,
                angle: new THREE.Vector3(0, -1, 1.5), // Yukarıdan bakış
                easing: 0.05,
                distance: this.zoom.minDistance + 10,
                height: 5
            }
        }

        // Aktif mod
        this.activeMode = 'thirdPerson'
    }

    /**
     * Kamera modunu ayarla
     * @param {string} mode - Kamera modu ('thirdPerson', 'firstPerson', 'free')
     */
    setMode(mode) {
        // Modu kontrol et
        if (!this.modes[mode]) {
            console.error(`Geçersiz kamera modu: ${mode}`)
            return
        }

        // Önceki mod
        const prevMode = this.activeMode;
        
        // Önceki modu devre dışı bırak
        if (this.modes[this.activeMode]) {
            this.modes[this.activeMode].active = false
        }

        // Yeni modu etkinleştir
        this.modes[mode].active = true
        this.activeMode = mode

        // Kamera özelliklerini ayarla
        const modeSettings = this.modes[mode]
        
        // 1. şahıs moduna geçiyorsa daha hızlı, diğer modlara daha yumuşak geçiş
        const transitionDuration = mode === 'firstPerson' ? 0.5 : 1.5;
        
        // Açı değerini güncelle - smooth geçiş için gsap kullan
        gsap.to(this.angle.value, {
            x: modeSettings.angle.x,
            y: modeSettings.angle.y,
            z: modeSettings.angle.z,
            duration: transitionDuration,
            ease: 'power2.inOut'
        })
        
        // Easing ayarı
        this.easing = modeSettings.easing
        
        // Zoom ayarlarını güncelle
        gsap.to(this.zoom, { 
            minDistance: modeSettings.distance,
            amplitude: mode === 'firstPerson' ? 0.1 : 5, // 1. şahıs modunda çok daha az zoom aralığı
            duration: transitionDuration,
            ease: 'power2.inOut'
        })
        
        // 1. şahıs modunda eğer araç varsa, kamera yüksekliğini ayarla
        if (mode === 'firstPerson') {
            // Pan'ı sıfırla - 1. şahıs modunda kaydırma olmasın
            this.pan.reset()
            this.pan.disable()
            
            // Kamera hedef yükseklik ayarı (z ekseninde)
            if (this.target) {
                gsap.to(this.target, {
                    z: modeSettings.height,
                    duration: transitionDuration * 0.5, // Daha hızlı yükseklik değişimi
                    ease: 'power1.out'
                })
            }
            
            // RC kamera titreşimini aktifleştir
            this.rcCameraShake.enabled = true;
            
        } else {
            // Diğer modlarda kamera hedefini normal yüksekliğe döndür
            this.pan.enable()
            
            // RC kamera titreşimini devre dışı bırak
            this.rcCameraShake.enabled = false;
            
            if (this.target) {
                gsap.to(this.target, {
                    z: 0,
                    duration: transitionDuration,
                    ease: 'power2.inOut'
                })
            }
        }
        
        // Debug için güncelle
        if (this.debug) {
            for (const key in this.debugFolder.__folders) {
                if (this.debugFolder.__folders[key].__controllers) {
                    for (const controller of this.debugFolder.__folders[key].__controllers) {
                        controller.updateDisplay()
                    }
                }
            }
        }
    }

    /**
     * 3. şahıs kamera modunu etkinleştir
     */
    setThirdPersonMode() {
        this.setMode('thirdPerson')
    }

    /**
     * 1. şahıs kamera modunu etkinleştir
     */
    setFirstPersonMode() {
        this.setMode('firstPerson')
    }

    /**
     * Serbest kamera modunu etkinleştir
     */
    setFreeMode() {
        this.setMode('free')
    }
}
