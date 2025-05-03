import * as THREE from 'three'
import Car from './Car.js'
import Bicycle from './Bicycle.js'
import Forklift from './Forklift.js'

export default class VehicleManager
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
        this.container.matrixAutoUpdate = false
        
        // Araçlar
        this.vehicles = {
            car: {
                name: 'Araba',
                type: 'car',
                class: Car,
                instance: null
            },
            bicycle: {
                name: 'Bisiklet',
                type: 'bicycle',
                class: Bicycle,
                instance: null
            },
            forklift: {
                name: 'Forklift',
                type: 'forklift',
                class: Forklift,
                instance: null
            }
        }
        
        // Aktif araç
        this.activeVehicle = null
        
        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('vehicles')
            // this.debugFolder.open()
        }
        
        // İlk aracı yükle
        this.setVehicle('car')
    }
    
    /**
     * Belirtilen tip aracı yükle ve aktifleştir
     */
    setVehicle(_type)
    {
        // Eğer aynı tip araç zaten aktif ise, işlem yapma
        if(this.activeVehicle && this.activeVehicle.type === _type)
        {
            return
        }
        
        // Mevcut aracı kaldır
        if(this.activeVehicle && this.activeVehicle.instance)
        {
            this.container.remove(this.activeVehicle.instance.container)
            this.activeVehicle.instance = null
        }
        
        // Araç tipini kontrol et
        const vehicle = this.vehicles[_type]
        if(!vehicle)
        {
            console.error(`Araç tipi bulunamadı: ${_type}`)
            return
        }
        
        // Yeni aracı oluştur
        const options = {
            time: this.time,
            resources: this.resources,
            objects: this.objects,
            physics: this.physics,
            shadows: this.shadows,
            materials: this.materials,
            controls: this.controls,
            sounds: this.sounds,
            renderer: this.renderer,
            camera: this.camera,
            debug: this.debug,
            config: this.config
        }
        
        // Araç örneğini oluştur
        vehicle.instance = new vehicle.class(options)
        
        // Aracı sahneye ekle
        this.container.add(vehicle.instance.container)
        
        // Aktif aracı güncelle
        this.activeVehicle = {
            type: _type,
            name: vehicle.name,
            instance: vehicle.instance
        }
        
        // Oyuncu konumunu aracın konumuna ayarla
        if(this.physics && this.physics.car && vehicle.instance.position)
        {
            this.physics.car.chassis.body.position.copy(vehicle.instance.position)
        }
        
        // Olay tetikle
        if(typeof window !== 'undefined')
        {
            window.dispatchEvent(new CustomEvent('vehicleChanged', { detail: { type: _type, name: vehicle.name } }))
        }
        
        return vehicle.instance
    }
    
    /**
     * Klavye kısayolu ile araç değiştirme
     * NOT: V tuşu ile araç değiştirme özelliği kaldırıldı.
     * Araç değiştirmek için sol üstteki araç seçici UI'ı kullanın.
     */
    setupKeyboardShortcut()
    {
        // V tuşu ile araç değiştirme özelliği kaldırıldı.
        // Araç seçimi artık sadece UI üzerinden yapılabilir.
        
        /*
        window.addEventListener('keydown', (_event) =>
        {
            // V tuşu ile araç değiştirme
            if(_event.key === 'v')
            {
                // Mevcut araçlar listesinden bir sonrakine geç
                const vehicleTypes = Object.keys(this.vehicles)
                const currentIndex = vehicleTypes.indexOf(this.activeVehicle.type)
                const nextIndex = (currentIndex + 1) % vehicleTypes.length
                const nextType = vehicleTypes[nextIndex]
                
                this.setVehicle(nextType)
            }
        })
        */
    }
} 