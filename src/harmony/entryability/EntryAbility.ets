/**
 * Genesis EntryAbility
 * 
 * Main entry point for the Genesis MetaAbility (元服务).
 * Handles lifecycle events and initializes the Genesis service.
 */

import { GenesisService } from '../GenesisService';

export default class EntryAbility {
  private genesisService: GenesisService | null = null;

  onCreate(want, launchParam) {
    console.info('[Genesis] EntryAbility onCreate');
    
    // Initialize Genesis service
    this.genesisService = new GenesisService();
    this.genesisService.initialize(want.parameters?.userId);
    
    console.info('[Genesis] Service initialized');
  }

  onDestroy() {
    console.info('[Genesis] EntryAbility onDestroy');
    this.genesisService?.destroy();
  }

  onWindowStageCreate(windowStage) {
    console.info('[Genesis] onWindowStageCreate');
    
    // Load the main game page
    windowStage.loadContent('pages/GamePage', (err, data) => {
      if (err.code) {
        console.error('[Genesis] Failed to load content:', JSON.stringify(err));
        return;
      }
      console.info('[Genesis] Content loaded successfully');
    });
  }

  onForeground() {
    console.info('[Genesis] App moved to foreground');
  }

  onBackground() {
    console.info('[Genesis] App moved to background');
  }
}
