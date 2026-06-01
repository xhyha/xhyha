/**
 * Genesis Micro-Game Page
 * 
 * HarmonyOS ArkTS page for rendering micro-games.
 * This is the main game UI that runs within the MetaAbility.
 * 
 * Note: This file uses ArkTS syntax and is designed for
 * HarmonyOS DevEco Studio. It can be compiled in a HarmonyOS project
 * but serves as reference implementation here.
 */

// ===== Types (mirrored from core types for ArkTS compatibility) =====
interface GameState {
  PLAYING: string;
  COMPLETED: string;
  IDLE: string;
}

interface GameEntity {
  id: string;
  position: { x: number; y: number };
  size: { x: number; y: number };
  visible: boolean;
}

interface MicroGameData {
  config: {
    id: string;
    name: string;
    type: string;
    maxDuration: number;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
    };
  };
  state: string;
  score: number;
  elapsed: number;
  entities: GameEntity[];
}

// ===== Game Page Component =====
@Entry
@Component
struct GamePage {
  // State
  @State gameData: MicroGameData | null = null;
  @State isPlaying: boolean = false;
  @State showResult: boolean = false;
  @State finalScore: number = 0;
  @State timeRemaining: number = 0;
  @State countdown: number = 3;

  private gameTimer: number = -1;
  private updateInterval: number = 16; // ~60fps

  aboutToAppear() {
    this.startCountdown();
  }

  aboutToDisappear() {
    this.cleanup();
  }

  // ===== Countdown before game starts =====
  private startCountdown() {
    this.countdown = 3;
    const countdownTimer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(countdownTimer);
        this.startGame();
      }
    }, 1000);
  }

  // ===== Start the game =====
  private startGame() {
    this.isPlaying = true;
    this.showResult = false;
    // Game would be started via GenesisService
    // this.gameData = genesisService.startMicroGame(game);
  }

  // ===== Handle touch input =====
  private handleTouch(x: number, y: number, type: string) {
    if (!this.isPlaying || !this.gameData) return;
    // Process input via GenesisService
    // this.gameData = genesisService.handleTouchInput(type, x, y);
    this.checkGameEnd();
  }

  // ===== Check if game ended =====
  private checkGameEnd() {
    if (this.gameData && this.gameData.state === 'COMPLETED') {
      this.isPlaying = false;
      this.showResult = true;
      this.finalScore = this.gameData.score;
      // Process result via GenesisService
      // genesisService.finishMicroGame();
    }
  }

  // ===== Cleanup =====
  private cleanup() {
    if (this.gameTimer !== -1) {
      clearInterval(this.gameTimer);
    }
  }

  // ===== Build UI =====
  build() {
    Column() {
      // Header: Score + Timer
      this.GameHeader();

      // Game Area
      if (this.showResult) {
        this.ResultView();
      } else if (this.countdown > 0) {
        this.CountdownView();
      } else {
        this.GameArea();
      }

      // Footer: Controls
      this.GameFooter();
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.gameData?.config.theme.backgroundColor ?? '#1A1A2E')
  }

  // ===== Header Component =====
  @Builder
  GameHeader() {
    Row() {
      // Score
      Column() {
        Text('SCORE')
          .fontSize(12)
          .fontColor('#AAAAAA')
        Text(`${this.gameData?.score ?? 0}`)
          .fontSize(28)
          .fontColor('#FFFFFF')
          .fontWeight(FontWeight.Bold)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      // Game Name
      Text(this.gameData?.config.name ?? 'Genesis')
        .fontSize(16)
        .fontColor(this.gameData?.config.theme.primaryColor ?? '#CF0A2C')
        .fontWeight(FontWeight.Bold)

      // Timer
      Column() {
        Text('TIME')
          .fontSize(12)
          .fontColor('#AAAAAA')
        Text(`${this.timeRemaining}s`)
          .fontSize(28)
          .fontColor(this.timeRemaining <= 10 ? '#E74C3C' : '#FFFFFF')
          .fontWeight(FontWeight.Bold)
      }
      .alignItems(HorizontalAlign.End)
      .layoutWeight(1)
    }
    .width('100%')
    .padding({ left: 20, right: 20, top: 16, bottom: 8 })
    .justifyContent(FlexAlign.SpaceBetween)
  }

  // ===== Countdown View =====
  @Builder
  CountdownView() {
    Column() {
      Text(`${this.countdown}`)
        .fontSize(80)
        .fontColor('#CF0A2C')
        .fontWeight(FontWeight.Bold)
        .animation({ duration: 300 })
    }
    .width('100%')
    .layoutWeight(1)
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
  }

  // ===== Game Area =====
  @Builder
  GameArea() {
    Stack() {
      // Game entities would be rendered here based on gameData.entities
      // This is a simplified placeholder
      Canvas(null)
        .width('100%')
        .layoutWeight(1)
        .onReady(() => {
          // Initialize canvas for game rendering
        })
    }
    .width('100%')
    .layoutWeight(1)
    .onClick((event) => {
      this.handleTouch(
        event.target.area.globalPosition.x,
        event.target.area.globalPosition.y,
        'tap'
      );
    })
  }

  // ===== Result View =====
  @Builder
  ResultView() {
    Column() {
      Text('\uD83C\uDF89')
        .fontSize(60)

      Text('Game Complete!')
        .fontSize(24)
        .fontColor('#FFFFFF')
        .fontWeight(FontWeight.Bold)
        .margin({ top: 16 })

      Text(`Score: ${this.finalScore}`)
        .fontSize(36)
        .fontColor('#FFD700')
        .fontWeight(FontWeight.Bold)
        .margin({ top: 8 })

      // Action buttons
      Row() {
        Button('Play Again')
          .backgroundColor('#CF0A2C')
          .fontColor('#FFFFFF')
          .borderRadius(24)
          .width(140)
          .height(44)
          .onClick(() => {
            this.showResult = false;
            this.startCountdown();
          })

        Button('Share')
          .backgroundColor('#333333')
          .fontColor('#FFFFFF')
          .borderRadius(24)
          .width(140)
          .height(44)
          .margin({ left: 16 })
      }
      .margin({ top: 32 })
    }
    .width('100%')
    .layoutWeight(1)
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
  }

  // ===== Footer =====
  @Builder
  GameFooter() {
    Row() {
      Text('Powered by Genesis AI')
        .fontSize(10)
        .fontColor('#666666')
    }
    .width('100%')
    .padding(8)
    .justifyContent(FlexAlign.Center)
  }
}
