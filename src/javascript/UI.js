export default class UI {
    constructor(_options) {
        // Options
        this.vehicleManager = _options.vehicleManager
        this.camera = _options.camera
        this.debug = _options.debug

        // UI elemanları için zamanlayıcılar ekle
        this.ensureUIVisibility()
        
        // Set up
        this.setupVehicleSelector()
        this.setupCameraSelector()
        this.setupKeyboardShortcuts()
        
        // Debug
        console.log('UI initialized')
    }
    
    /**
     * Klavye kısayollarını ayarla
     */
    setupKeyboardShortcuts() {
        // Kamera modları arasında C tuşu ile geçiş
        const cameraModes = ['thirdPerson', 'firstPerson', 'free'];
        
        // Başlangıç modunu ayarla - eğer aktif kamera modu zaten ayarlandıysa onu kullan
        let currentModeIndex = 0; // Varsayılan olarak 3. şahıs modunu kullan
        
        // Aktif modu bul (eğer daha önce ayarlandıysa)
        if (this.activeCamera && cameraModes.includes(this.activeCamera)) {
            currentModeIndex = cameraModes.indexOf(this.activeCamera);
        }
        
        // Klavye olaylarını dinle
        window.addEventListener('keydown', (event) => {
            // C tuşuna basıldığında kamera modunu değiştir
            if (event.key === 'c' || event.key === 'C') {
                // Sonraki moda geç
                currentModeIndex = (currentModeIndex + 1) % cameraModes.length;
                const nextMode = cameraModes[currentModeIndex];
                
                // Kamera modunu değiştir
                this.setCameraMode(nextMode);
                
                // UI'daki dropdown seçimini güncelle
                if (this.cameraSelector && this.cameraSelector.options) {
                    this.cameraSelector.options.forEach(option => {
                        if (option.getAttribute('data-camera') === nextMode) {
                            option.classList.add('active');
                        } else {
                            option.classList.remove('active');
                        }
                    });
                }
                
                // Özel bildirim göster
                this.showCameraModeNotification(nextMode);
            }
        });
    }
    
    /**
     * UI elemanlarının görünürlüğünü sağla
     */
    ensureUIVisibility() {
        // İlk yükleme sonrası
        setTimeout(() => {
            this.forceShowUI()
        }, 100)
        
        // Bir süre sonra tekrar kontrol et
        setTimeout(() => {
            this.forceShowUI()
        }, 1000)
        
        // Periyodik olarak kontrol et
        setInterval(() => {
            this.forceShowUI()
        }, 5000)
    }
    
    /**
     * UI elemanlarını zorla göster
     */
    forceShowUI() {
        const vehicleSelector = document.querySelector('.js-vehicle-selector')
        const cameraSelector = document.querySelector('.js-camera-selector')
        
        if (vehicleSelector) {
            vehicleSelector.style.display = 'block'
            vehicleSelector.style.visibility = 'visible'
            vehicleSelector.style.opacity = '1'
            vehicleSelector.style.zIndex = '10000'
        }
        
        if (cameraSelector) {
            cameraSelector.style.display = 'block'
            cameraSelector.style.visibility = 'visible'
            cameraSelector.style.opacity = '1'
            cameraSelector.style.zIndex = '10000'
        }
    }

    /**
     * Araç seçimi UI'sinin kurulumu
     */
    setupVehicleSelector() {
        this.vehicleSelector = {}
        this.vehicleSelector.element = document.querySelector('.js-vehicle-selector')
        
        if (!this.vehicleSelector.element) {
            console.error('Araç seçici UI elemanı bulunamadı')
            return
        }
        
        this.vehicleSelector.toggleButton = this.vehicleSelector.element.querySelector('.js-vehicle-selector-toggle')
        this.vehicleSelector.dropdown = this.vehicleSelector.element.querySelector('.vehicle-selector-dropdown')
        this.vehicleSelector.options = this.vehicleSelector.element.querySelectorAll('.vehicle-option')

        // Başlangıçta UI elemanını force-visible yap
        this.vehicleSelector.element.style.display = 'block'
        this.vehicleSelector.element.style.visibility = 'visible'
        this.vehicleSelector.element.style.opacity = '1'
        this.vehicleSelector.element.style.zIndex = '10000'

        // Toggle butonu için click olayı dinleyicisi
        this.vehicleSelector.toggleButton.addEventListener('click', () => {
            this.vehicleSelector.element.classList.toggle('active')
        })

        // Dışarıya tıklandığında dropdown'u kapat
        document.addEventListener('click', (event) => {
            if (!this.vehicleSelector.element.contains(event.target)) {
                this.vehicleSelector.element.classList.remove('active')
            }
        })

        // Araç seçenekleri için click olayı dinleyicisi
        this.vehicleSelector.options.forEach(option => {
            option.addEventListener('click', () => {
                // Aktif sınıfını güncelle
                this.vehicleSelector.options.forEach(opt => opt.classList.remove('active'))
                option.classList.add('active')

                // Araç değiştir
                const vehicleType = option.getAttribute('data-vehicle')
                this.vehicleManager.setVehicle(vehicleType)

                // Dropdown'u kapat
                this.vehicleSelector.element.classList.remove('active')
            })
        })

        // VehicleManager'daki değişiklikleri dinle
        window.addEventListener('vehicleChanged', (event) => {
            // UI'ı güncelle
            this.vehicleSelector.toggleButton.textContent = `Araç: ${event.detail.name}`
            
            // Aktif sınıfını güncelle
            this.vehicleSelector.options.forEach(option => {
                if(option.getAttribute('data-vehicle') === event.detail.type) {
                    option.classList.add('active')
                } else {
                    option.classList.remove('active')
                }
            })
        })
    }

    /**
     * Kamera modu seçimi UI'sinin kurulumu
     */
    setupCameraSelector() {
        this.cameraSelector = {}
        this.cameraSelector.element = document.querySelector('.js-camera-selector')
        
        if (!this.cameraSelector.element) {
            console.error('Kamera seçici UI elemanı bulunamadı')
            return
        }
        
        this.cameraSelector.toggleButton = this.cameraSelector.element.querySelector('.js-camera-selector-toggle')
        this.cameraSelector.dropdown = this.cameraSelector.element.querySelector('.camera-selector-dropdown')
        this.cameraSelector.options = this.cameraSelector.element.querySelectorAll('.camera-option')
        
        // Başlangıçta UI elemanını force-visible yap
        this.cameraSelector.element.style.display = 'block'
        this.cameraSelector.element.style.visibility = 'visible'
        this.cameraSelector.element.style.opacity = '1'
        this.cameraSelector.element.style.zIndex = '10000'
        
        // Aktif kamera modu
        this.activeCamera = 'thirdPerson'

        // Toggle butonu için click olayı dinleyicisi
        this.cameraSelector.toggleButton.addEventListener('click', () => {
            this.cameraSelector.element.classList.toggle('active')
        })

        // Dışarıya tıklandığında dropdown'u kapat
        document.addEventListener('click', (event) => {
            if (!this.cameraSelector.element.contains(event.target)) {
                this.cameraSelector.element.classList.remove('active')
            }
        })

        // Kamera seçenekleri için click olayı dinleyicisi
        this.cameraSelector.options.forEach(option => {
            option.addEventListener('click', () => {
                // Aktif sınıfını güncelle
                this.cameraSelector.options.forEach(opt => opt.classList.remove('active'))
                option.classList.add('active')

                // Kamera modunu değiştir
                const cameraMode = option.getAttribute('data-camera')
                this.setCameraMode(cameraMode)

                // Dropdown'u kapat
                this.cameraSelector.element.classList.remove('active')
            })
        })
    }

    /**
     * Kamera modunu değiştir
     * @param {string} mode - Kamera modu ('thirdPerson', 'firstPerson', 'free')
     */
    setCameraMode(mode) {
        // Önceki modu kaydet
        this.activeCamera = mode

        // Kamera modlarını uygula
        switch(mode) {
            case 'thirdPerson':
                console.log('Kamera modu: 3. Şahıs')
                this.camera.setThirdPersonMode()
                break
            case 'firstPerson':
                console.log('Kamera modu: 1. Şahıs') 
                this.camera.setFirstPersonMode()
                break
            case 'free':
                console.log('Kamera modu: Serbest')
                this.camera.setFreeMode()
                break
        }

        // UI'yı güncelle - toggle butonun metnini de güncelle
        if (this.cameraSelector && this.cameraSelector.toggleButton) {
            this.cameraSelector.toggleButton.textContent = `Kamera: ${this.getCameraModeDisplayName(mode)}`
            
            // Ekran üzerinde görünür bir bildirim göster
            this.showCameraModeNotification(mode);
        }
    }

    /**
     * Kamera modu değiştiğinde ekranda kısa bir bildirim göster
     * @param {string} mode - Kamera modu
     */
    showCameraModeNotification(mode) {
        // Halihazırda bir bildirim varsa kaldır
        const existingNotification = document.querySelector('.camera-mode-notification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }
        
        // Kamera geçiş animasyonu ekle
        const transitionEffect = document.createElement('div');
        transitionEffect.className = 'camera-transition';
        document.body.appendChild(transitionEffect);
        
        // Geçiş efektini göster
        setTimeout(() => {
            transitionEffect.style.opacity = '1';
        }, 10);
        
        // Geçiş efektini kaldır
        setTimeout(() => {
            transitionEffect.style.opacity = '0';
            setTimeout(() => {
                if (transitionEffect.parentNode) {
                    document.body.removeChild(transitionEffect);
                }
            }, 200);
        }, 150);
        
        // Yeni bildirim oluştur
        const notification = document.createElement('div');
        notification.className = 'camera-mode-notification';
        notification.textContent = `Kamera: ${this.getCameraModeDisplayName(mode)}`;
        
        // Bildirim ekle
        document.body.appendChild(notification);
        
        // Bildirim animasyonu
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Bildirim süresini ayarla
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Kamera modu için görüntülenecek ismi döndür
     */
    getCameraModeDisplayName(mode) {
        switch(mode) {
            case 'thirdPerson': return '3. Şahıs'
            case 'firstPerson': return '1. Şahıs'
            case 'free': return 'Serbest'
            default: return 'Bilinmeyen'
        }
    }
} 