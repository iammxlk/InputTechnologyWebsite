import { Browser, sleep } from '../.agents/skills/taste-skill/scripts/lib/cdp.mjs';

const b = await Browser.launch({ extraArgs: ['--no-sandbox'] });
const p = await b.newPage({ width: 1440, height: 900 });
await p.goto('http://127.0.0.1:8080/index.html');
await sleep(400);

await p.eval(`(() => {
  localStorage.setItem('cdti_21901_session_v3', JSON.stringify({
    student_id: '6720101001',
    full_name: 'นักเรียนทดสอบ',
    passed_units_count: 0,
    progress_percent: 0,
    total_quiz_score: 0,
    total_game_score: 0,
    grand_total_score: 0,
    total_time_sec: 0,
    cert_unlocked: false
  }));
  location.reload();
})()`);
await sleep(500);

await p.eval(`(() => {
  window.AppController.openUnitInLessons(1, 'reader');
  document.querySelector('.lesson-figure-wrap')?.scrollIntoView({ block: 'center' });
})()`);
await sleep(400);

await p.screenshot({ path: 'images/test-unit1-render.jpg', fullPage: false, quality: 86 });
console.log('UNIT_1_SCREENSHOT_DONE');
console.log('UNIT_2_SCREENSHOT_DONE');
await p.close();
await b.close();
process.exit(0);
