/**
 * Genesis Game Widget (服务卡片)
 * 
 * HarmonyOS FormAbility widget that shows daily micro-game
 * on the device home screen. Supports direct interaction.
 */

interface WidgetData {
  hasActiveGame: boolean;
  gameName: string;
  score: number;
  message: string;
}

@Entry
@Component
struct GameWidget {
  @State widgetData: WidgetData = {
    hasActiveGame: false,
    gameName: '',
    score: 0,
    message: "Today's micro-game awaits!",
  };

  build() {
    Column() {
      // Widget Header
      Row() {
        Text('\uD83C\uDFAE Genesis')
          .fontSize(14)
          .fontColor('#CF0A2C')
          .fontWeight(FontWeight.Bold)

        Blank()

        Text(this.widgetData.hasActiveGame ? '\u25CF LIVE' : 'NEW')
          .fontSize(10)
          .fontColor(this.widgetData.hasActiveGame ? '#2ECC71' : '#FFD700')
      }
      .width('100%')
      .padding({ left: 12, right: 12, top: 8 })

      // Widget Content
      Column() {
        if (this.widgetData.hasActiveGame) {
          // Active game state
          Text(this.widgetData.gameName)
            .fontSize(16)
            .fontColor('#FFFFFF')
            .fontWeight(FontWeight.Bold)

          Row() {
            Text('Score:')
              .fontSize(12)
              .fontColor('#AAAAAA')
            Text(`${this.widgetData.score}`)
              .fontSize(20)
              .fontColor('#FFD700')
              .fontWeight(FontWeight.Bold)
              .margin({ left: 4 })
          }
          .margin({ top: 8 })
        } else {
          // No active game
          Text(this.widgetData.message)
            .fontSize(14)
            .fontColor('#CCCCCC')
            .textAlign(TextAlign.Center)
        }
      }
      .width('100%')
      .layoutWeight(1)
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Center)
      .padding({ left: 12, right: 12 })

      // Widget Footer
      Row() {
        Text('Tap to play \u2192')
          .fontSize(12)
          .fontColor('#CF0A2C')
      }
      .width('100%')
      .padding({ left: 12, right: 12, bottom: 8 })
      .justifyContent(FlexAlign.End)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#1A1A2E')
    .borderRadius(16)
    .onClick(() => {
      // Open the full Genesis MetaAbility
      // postCardAction(this, { action: 'router', abilityName: 'EntryAbility' });
    })
  }
}
