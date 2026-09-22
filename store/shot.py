"""Production screenshots: python3 store/shot.py (pip install playwright pillow).
Install browser once: python3 -m playwright install chromium.
Synthetic records only; no personal data. No changes to the production app.
"""
import json
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent
URL = 'https://ryoseiimai.github.io/pocket-gym/app/'
TODAY = '2026-09-23'


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 440, 'height': 956},
                                      device_scale_factor=3, locale='ja-JP',
                                      timezone_id='Asia/Tokyo', color_scheme='light')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.clock.set_fixed_time('2026-09-23T10:00:00+09:00')
        page.goto(URL, wait_until='networkidle')
        state = page.evaluate('''async () => {
          const {emptyState, validateImport} = await import('./js/store.js');
          const {generateMenu} = await import('./js/menu.js');
          const {applySessionResults} = await import('./js/progress.js');
          const state = emptyState();
          state.profile = {goal:'tighten', experience:'beginner', place:'home-none',
            daysPerWeek:3, minutes:15, onboarded:true};
          // Ten synthetic sessions in fourteen days, using one unchanged profile.
          // The first six charted exercises each occur at least twice.
          for (const date of ['2026-09-09','2026-09-10','2026-09-12','2026-09-13',
                             '2026-09-14','2026-09-16','2026-09-17','2026-09-18',
                             '2026-09-19','2026-09-22']) {
            const menu = generateMenu(state.profile, date, state.exerciseState);
            const feels = {};
            for (const item of menu) {
              const ratings = Array.from({length:item.sets}, () =>
                item.phase !== 'main' ? 'ok' : 'easy');
              feels[item.exerciseId] = ratings;
              for (const feel of ratings) state.logs.push({date, exerciseId:item.exerciseId,
                feel, count:item.amount});
            }
            state.exerciseState = applySessionResults(state.exerciseState, feels);
            state.sessions.push({date, exerciseIds:menu.map(m => m.exerciseId)});
          }
          const checked = validateImport(state);
          if (!checked.ok || JSON.stringify(checked.data) !== JSON.stringify(state))
            throw new Error('Seed schema mismatch: ' + JSON.stringify(checked));
          return state;
        }''')
        (BASE / 'sample-state.json').write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')

        def seed(value):
            page.evaluate('(s) => localStorage.setItem("pocketgym.v1", JSON.stringify(s))', value)
            page.reload(wait_until='networkidle')

        def shot(name):
            page.evaluate('window.scrollTo(0, 0)')
            page.evaluate('document.activeElement.blur()')
            page.evaluate('document.fonts.ready')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            path = BASE / 'screenshots' / name
            page.screenshot(path=str(path), animations='disabled')
            with Image.open(path) as im:
                assert im.size == (1320, 2868), im.size
            print(name)

        seed({**state, 'profile': None})
        shot('01_counseling.png')
        seed(state)
        shot('02_today.png')
        page.get_by_role('button', name='トレーニング開始', exact=True).click()
        # Complete the two fixed warmups to show the first main exercise.
        for _ in range(2):
            page.get_by_role('button', name='ちょうど', exact=True).click()
        shot('03_workout.png')
        page.get_by_role('button', name='ちょうど', exact=True).click()
        page.get_by_role('heading', name='休憩中').wait_for()
        shot('04_rest_timer.png')
        seed(state)  # Discard the partial demonstration session before showing history.
        page.get_by_role('button', name='振り返り', exact=True).click()
        page.locator('.chart-list svg').first.wait_for()
        charts = page.locator('.chart-item').evaluate_all('''items => items
          .filter(e => e.getBoundingClientRect().top < innerHeight - 70)
          .map(e => ({name:e.querySelector('.chart-title').textContent,
            points:[...e.querySelectorAll('circle')].map(p =>
              ({x:Number(p.getAttribute('cx')),y:Number(p.getAttribute('cy'))}))}))''')
        assert charts, 'No visible charts'
        for chart in charts:
            points = chart['points']
            assert len(points) >= 2, chart
            assert points[-1]['y'] < points[0]['y'], chart
            assert all(b['x'] > a['x'] and b['y'] <= a['y']
                       for a, b in zip(points, points[1:])), chart
        shot('05_reflection.png')
        assert not errors, errors
        (BASE / 'capture-info.json').write_text(json.dumps({
            'url': URL, 'date': TODAY, 'browser': browser.version,
            'viewport': {'width':440, 'height':956}, 'deviceScaleFactor':3,
            'sessions': len(state['sessions']), 'logs':len(state['logs']),
            'consoleErrors':errors, 'syntheticData':True, 'visibleCharts':charts
        }, ensure_ascii=False, indent=2) + '\n')
        browser.close()


if __name__ == '__main__':
    main()
