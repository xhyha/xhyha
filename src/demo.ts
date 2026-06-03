/**
 * Genesis AI Micro-Game Engine - Interactive Demo
 * 
 * Run: npx ts-node src/demo.ts
 * 
 * This demo showcases the complete Genesis system:
 * 1. User profile creation (hardcore vs casual)
 * 2. Trigger evaluation across multiple scenarios
 * 3. Personalized game generation
 * 4. Full game lifecycle (generate → start → input → update → end)
 * 5. Profile learning and adaptation
 * 6. Widget data generation
 */

import { MicroGameEngine } from './engine/MicroGameEngine';
import { TriggerContextFactory } from './models/TriggerContext';
import { UserProfileFactory } from './models/UserProfile';
import { BuiltInTriggers } from './triggers/BuiltInTriggers';
import {
  GameState, Difficulty,
  IUserProfile, ITriggerContext,
} from './models/types';

// ===== Console Helpers =====
const SEPARATOR = '─'.repeat(60);
const DOUBLE_SEP = '═'.repeat(60);

function header(title: string) {
  console.log(`\n${DOUBLE_SEP}`);
  console.log(`  ${title}`);
  console.log(`${DOUBLE_SEP}\n`);
}

function section(title: string) {
  console.log(`\n${SEPARATOR}`);
  console.log(`  ▸ ${title}`);
  console.log(`${SEPARATOR}`);
}

function info(label: string, value: any) {
  console.log(`  ${label}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
}

function success(msg: string) {
  console.log(`  ✅ ${msg}`);
}

function badge(label: string, color: string = 'blue') {
  const colors: Record<string, string> = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  };
  const reset = '\x1b[0m';
  return `${colors[color] || ''}[${label}]${reset}`;
}

// ===== Demo Functions =====

function demo1_userProfiles() {
  header('DEMO 1: User Profile Creation');
  
  const hardcore = UserProfileFactory.createHardcoreGamer('player_001');
  const casual = UserProfileFactory.createCasualGamer('player_002');
  const newbie = UserProfileFactory.create('player_003');

  section('Hardcore Gamer Profile');
  info('User ID', hardcore.userId);
  info('Top Taste', getMaxTaste(hardcore));
  info('Preferred Difficulty', Difficulty[hardcore.preferredDifficulty]);
  info('Reaction Speed', `${hardcore.averageReactionSpeed}ms`);
  info('Games Played', hardcore.totalGamesPlayed);

  section('Casual Gamer Profile');
  info('User ID', casual.userId);
  info('Top Taste', getMaxTaste(casual));
  info('Preferred Difficulty', Difficulty[casual.preferredDifficulty]);
  info('Reaction Speed', `${casual.averageReactionSpeed}ms`);

  section('Newbie Profile');
  info('User ID', newbie.userId);
  info('Top Taste', getMaxTaste(newbie));
  info('Preferred Difficulty', Difficulty[newbie.preferredDifficulty]);

  return { hardcore, casual, newbie };
}

function demo2_triggerScenarios() {
  header('DEMO 2: Trigger Evaluation');

  const engine = new MicroGameEngine();
  engine.registerTriggers(BuiltInTriggers.getAll());

  const scenarios: Array<{ name: string; context: ITriggerContext }> = [
    { name: '🎮 Download Waiting (30%)', context: TriggerContextFactory.createDownloadWaiting(30) },
    { name: '😢 Losing Streak (5 losses)', context: TriggerContextFactory.createLosingStreak(5) },
    { name: '🌙 Late Night (23:00)', context: TriggerContextFactory.createLateNight() },
    { name: '🌅 Morning (7:00)', context: TriggerContextFactory.createMorning() },
    { name: '🚇 Commute', context: TriggerContextFactory.createCommute() },
    { name: '🌧️ Rainy Day', context: TriggerContextFactory.createDefault({ weatherCondition: 'rain' }) },
    { name: '😊 Normal State (no trigger)', context: TriggerContextFactory.createDefault() },
    { name: '👥 Friends Online (3)', context: TriggerContextFactory.createDefault({ friendOnlineCount: 3 }) },
  ];

  for (const scenario of scenarios) {
    const result = engine.checkTrigger(scenario.context);
    const status = result.triggered
      ? `🔥 TRIGGERED: ${result.trigger!.name} ${badge(result.trigger!.category, 'green')}`
      : `   Suppressed: ${result.reason}`;
    console.log(`  ${scenario.name} → ${status}`);
  }

  engine.destroy();
  return;
}

function demo3_gameGeneration(profiles: ReturnType<typeof demo1_userProfiles>) {
  header('DEMO 3: Personalized Game Generation');

  const engine = new MicroGameEngine();
  engine.registerTriggers(BuiltInTriggers.getAll());

  for (const [label, profile] of Object.entries(profiles)) {
    section(`Game for ${label} gamer`);
    
    const context = TriggerContextFactory.createDefault();
    const game = engine.generateGame(profile, context);

    if (game) {
      info('Game Name', game.config.name);
      info('Game Type', game.config.type);
      info('Difficulty', Difficulty[game.config.difficulty]);
      info('Duration', `${game.config.estimatedDuration}s`);
      info('Theme Primary', game.config.theme.primaryColor);
      info('Entities', game.entities.length);
      success(`Game generated for ${label} gamer!`);
    }
  }

  engine.destroy();
  return;
}

function demo4_fullGameLifecycle() {
  header('DEMO 4: Full Game Lifecycle');

  const engine = new MicroGameEngine();
  engine.registerTriggers(BuiltInTriggers.getAll());
  const profile = UserProfileFactory.createHardcoreGamer('demo_player');

  // Step 1: Trigger check
  section('Step 1: Check Triggers');
  const context = TriggerContextFactory.createDownloadWaiting(50);
  const triggerResult = engine.checkTrigger(context);
  info('Trigger Result', triggerResult.triggered ? `FIRED: ${triggerResult.trigger!.name}` : 'None');
  if (!triggerResult.triggered) {
    // Force generate regardless
    info('Note', 'No trigger fired, generating game on demand');
  }

  // Step 2: Generate game
  section('Step 2: Generate Game');
  const game = engine.generateGame(profile, context);
  if (!game) {
    console.log('  ❌ Failed to generate game');
    engine.destroy();
    return;
  }
  info('Game ID', game.config.id);
  info('Game Type', game.config.type);
  info('Game Name', game.config.name);
  info('State', game.state);
  success('Game generated!');

  // Step 3: Start game
  section('Step 3: Start Game');
  engine.startGame(game);
  info('State', engine.getActiveGame()?.state);
  success('Game started!');

  // Step 4: Simulate gameplay
  section('Step 4: Simulate Gameplay');
  const events: string[] = [];

  engine.on('GAME_COMPLETED', (data) => {
    events.push(`Game completed with score ${data.score}`);
  });

  // Simulate taps
  const tapPositions = [
    { x: 80, y: 130 }, { x: 140, y: 130 }, { x: 200, y: 130 },
    { x: 80, y: 190 }, { x: 140, y: 190 },
  ];

  let updateCount = 0;
  for (const pos of tapPositions) {
    engine.handleInput({
      type: 'tap',
      position: pos,
      timestamp: Date.now(),
    });
    
    // Update game state
    engine.update(0.5);
    updateCount++;
    
    const active = engine.getActiveGame();
    if (active && active.state === GameState.COMPLETED) break;
  }

  const activeGame = engine.getActiveGame();
  info('Updates Processed', updateCount);
  info('Current Score', activeGame?.score ?? 0);
  info('Elapsed Time', `${(activeGame?.elapsed ?? 0).toFixed(1)}s`);
  info('State', activeGame?.state);

  // Step 5: End game
  section('Step 5: End Game & Get Result');
  const result = engine.endGame();
  if (result) {
    info('Final Score', result.score);
    info('Max Score', result.maxScore);
    info('Performance', `${((result.score / result.maxScore) * 100).toFixed(1)}%`);
    info('Duration', `${result.duration.toFixed(1)}s`);
    info('Completed', result.completed);
    success(`Game completed! Score: ${result.score}/${result.maxScore}`);
  }

  // Step 6: Update profile
  section('Step 6: Update User Profile');
  if (result) {
    const updated = engine.updateUserProfile(profile, result);
    info('Previous Difficulty', Difficulty[profile.preferredDifficulty]);
    info('Updated Difficulty', Difficulty[updated.preferredDifficulty]);
    info('Micro Games Played', updated.totalMicroGamesPlayed);
    success('Profile updated based on game performance!');
  }

  engine.destroy();
}

function demo5_widgetData() {
  header('DEMO 5: Widget Data (服务卡片)');

  const engine = new MicroGameEngine();
  const profile = UserProfileFactory.createCasualGamer('widget_user');
  const context = TriggerContextFactory.createDefault();

  const game = engine.generateGame(profile, context);
  if (game) {
    engine.startGame(game);
    
    const active = engine.getActiveGame();
    const widgetData = {
      hasActiveGame: true,
      gameId: active?.config.id,
      gameName: active?.config.name,
      gameType: active?.config.type,
      score: active?.score ?? 0,
      elapsed: Math.round(active?.elapsed ?? 0),
      state: active?.state,
    };

    section('Widget Data Output');
    console.log('  ┌─────────────────────────────────────┐');
    console.log('  │  🎮 Genesis                          │');
    console.log(`  │  ${widgetData.gameName} (${widgetData.gameType})`);
    console.log(`  │  Score: ${widgetData.score}  │  State: ${widgetData.state}  `);
    console.log('  │  Tap to play →                       │');
    console.log('  └─────────────────────────────────────┘');
    
    success('Widget data generated for HarmonyOS service card!');
  }

  engine.destroy();
}

function demo6_profileLearning() {
  header('DEMO 6: Profile Learning Over Multiple Games');

  const engine = new MicroGameEngine();
  let profile = UserProfileFactory.create('learning_user');

  section('Initial Profile');
  info('Difficulty', Difficulty[profile.preferredDifficulty]);
  info('Micro Games', profile.totalMicroGamesPlayed);

  // Simulate 5 games
  for (let i = 1; i <= 5; i++) {
    const context = TriggerContextFactory.createDefault();
    const game = engine.generateGame(profile, context);
    if (!game) continue;

    engine.startGame(game);
    
    // Simulate some gameplay
    for (let j = 0; j < 3; j++) {
      engine.handleInput({
        type: 'tap',
        position: { x: 80 + j * 60, y: 130 },
        timestamp: Date.now(),
      });
      engine.update(1.0);
    }

    const result = engine.endGame();
    if (result) {
      profile = engine.updateUserProfile(profile, result);
      const perf = result.maxScore > 0 ? ((result.score / result.maxScore) * 100).toFixed(0) : '0';
      console.log(`  Game ${i}: Score ${result.score}/${result.maxScore} (${perf}%) → Difficulty: ${Difficulty[profile.preferredDifficulty]}`);
    }
  }

  section('Final Profile');
  info('Difficulty', Difficulty[profile.preferredDifficulty]);
  info('Micro Games', profile.totalMicroGamesPlayed);
  info('Reaction Speed', `${profile.averageReactionSpeed}ms`);
  success('Profile adapted over 5 games!');

  engine.destroy();
}

// ===== Helpers =====
function getMaxTaste(profile: IUserProfile): string {
  const entries = Object.entries(profile.tasteProfile);
  entries.sort((a, b) => b[1] - a[1]);
  return `${entries[0][0]} (${(entries[0][1] * 100).toFixed(0)}%)`;
}

// ===== Main =====
function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  Genesis AI Micro-Game Engine - Demo');
  console.log('  华为游戏中心 · 鸿蒙元服务');
  console.log('═'.repeat(60));

  // Run all demos
  const profiles = demo1_userProfiles();
  demo2_triggerScenarios();
  demo3_gameGeneration(profiles);
  demo4_fullGameLifecycle();
  demo5_widgetData();
  demo6_profileLearning();

  console.log('\n' + '═'.repeat(60));
  console.log('  All demos completed successfully!');
  console.log('═'.repeat(60) + '\n');
}

main();
