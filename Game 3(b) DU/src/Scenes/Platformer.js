//Game 3(b) Dominic Umbrasas

class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.gameOver = false;  
        this.levelComplete = false;

        this.move = false;
        this.moveSoundTime = 0;  
        this.moveSoundDelay = 300;
    }

    create() {
        
        this.coinSFX = this.sound.add('coins');
        this.moveSFX = this.sound.add('move');
        this.landSFX = this.sound.add('land');
        this.winSFX = this.sound.add('win');

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1");
        
        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Create coins from Objects layer in tilemap
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        this.coinGroup = this.add.group(this.coins);

        // Find water tiles
        this.waterTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.water == true;
        });

        this.door = this.map.createFromObjects("Objects", {
            name: "door",
            key: "tilemap_sheet",
            frame: 130  
        })[0];  
        
        this.physics.world.enable(this.door, Phaser.Physics.Arcade.STATIC_BODY);
        this.door.body.setSize(18, 18);  
        this.doorGroup = this.add.group(this.door);

        this.winText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Level Complete\nPress any key to restart',
            {
                fontSize: '32px',
                fill: '#00ff00',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(0);
        
        this.input.keyboard.on('keydown', () => {
            if (this.gameOver || this.levelComplete) {
                this.scene.restart();
            }
        });

        this.bubbleParticles = this.add.particles('kenny-particles');

        this.waterTiles.forEach(tile => {
            const worldX = tile.getCenterX();
            const worldY = tile.getCenterY();
            this.add.particles(worldX, worldY, 'kenny-particles', {
                frame: 'circle_01.png',
                lifespan: { min:100, max: 2000 },
                speedY: { min: -50, max: -100 },
                scale: { start: 0.1, end: 0 },
                alpha: { start: 0.8, end: 0 },
                quantity: 1,
                frequency: 500,
                gravityY: 0
            });
        });

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(120, 200, "platformer_characters", "tile_0000.png");
        my.sprite.player.setMaxVelocity(250, 1000);

        this.jumpLandParticles = this.add.particles(0, 0, 'kenny-particles', {
            frame: 'smoke_03.png',
            lifespan: { min: 200, max: 400 },
            speed: { min: -40, max: 40 },
            scale: { start: 0.06, end: 0.15 },
            alpha: { start: 0.5, end: 0 },
            gravityY: -100,
            quantity: 8,
            tint: { start: 0x999999, end: 0xDDDDDD },
            emitting: false  
        });
        
        this.playerDust = this.add.particles(0, 0, 'kenny-particles', {
            frame: 'smoke_01.png',  
            lifespan: { min: 200, max: 700 },
            speed: { min: -30, max: 30 },
            scale: { start: 0.03, end: 0 },
            alpha: { start: 0.6, end: 0 },
            quantity: 1,
            frequency: 1000,
            gravityY: -200,
            emitting: false  
        });

        this.physics.add.overlap(my.sprite.player, this.door, () => {
            this.winSFX.play({ volume: 0.5 });
            this.levelComplete = true;
            this.winText.setVisible(true);
        }, null, this);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (player, coin) => {
            coin.destroy();
            this.coinSFX.play();
            // Create burst effect at coin location
            const burst = this.add.particles(coin.x, coin.y, 'kenny-particles', {
                frame: 'dirt_02.png',
                lifespan: { min: 100, max: 150 },
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.05, end: 0 },
                alpha: { start: 1, end: 0 },
                gravityY: 300,
                tint: { start: 0xFFD700, end: 0xFFFFAA },
                quantity: 10
            });
        
            // Optional: destroy emitter after it finishes
            this.time.delayedCall(600, () => {
                burst.destroy();
            });
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels + 400, this.map.heightInPixels);        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.gameOverText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Game Over\nPress any key to restart',
            {
                fontSize: '32px',
                fill: '#ff0000',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(0);

        this.input.keyboard.on('keydown', () => {
            if (this.gameOver) {
                this.scene.restart();
            }
        });
    }

    update() {
        if (this.gameOver) {
            my.sprite.player.setAcceleration(0);
            my.sprite.player.setVelocity(0);
            my.sprite.player.anims.stop();
            return;  
        }

        if (this.gameOver || this.levelComplete) {
            my.sprite.player.setAcceleration(0);
            my.sprite.player.setVelocity(0);
            my.sprite.player.anims.stop();
            return;
        }

        if (my.sprite.player.y > this.map.heightInPixels + 100) {
            this.gameOver = true;
            this.gameOverText.setVisible(true);
            return;
        }

        // Movement controls
        let moving = false;
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            moving = true;
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            moving = true;
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        if (moving && my.sprite.player.body.blocked.down) {
            if (this.time.now >= this.moveSoundTime) {
                this.moveSFX.play({ volume: 0.3 });  
                this.moveSoundTime = this.time.now + this.moveSoundDelay;
            }
        }     

        // Jumping animations & input
        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);

            this.jumpLandParticles.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
        }

        let land = my.sprite.player.body.blocked.down;

        if (!this.landed && land) {
            this.jumpLandParticles.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
            this.landSFX.play({ volume: 0.5 }); 
        }

        this.landed = land;


        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
        
            if (my.sprite.player.body.blocked.down) {
                this.playerDust.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
            }
        
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
        
            if (my.sprite.player.body.blocked.down) {
                this.playerDust.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
            }

        } 
        else 
        {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }
        
    }
}
