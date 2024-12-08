import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .init({
    resources: {
      en: {
        translation: {
          "settings": "Settings",
          "resume": "Resume",
          "main_menu": "Main Menu",
          "play": "Play",
          "tutorial": "Tutorial",
          "credits": "Credits",
          "quit": "Quit",
          "auto_save_detected": "Auto-Save Detected",
          "continue_previous_game": "Do you want to continue your previous game?",
          "yes": "Yes",
          "no": "No",
          "controls": "Controls",
          "controls_title": "Controls (Keyboard)",
          "controls_content": "Move: WASD\nSow/Harvest Plants: Arrow Keys\nAdvance Turn: T\nUndo Action: Z\nRedo Action: X\nLoad/Save Game: L",
          "goal": "Goal",
          "goal_title": "Goal",
          "goal_content": "Harvest {{winCondition}} fully grown plants in the \ngarden to win the game.\n\nBe mindful of each species' growth requirements.\n\nClick on a plant to view its growth \nlevel/requirements.",
          "garden": "Garden",
          "garden_title": "Garden",
          "garden_content": "The garden is represented by a grid system.\n\nEach cell contains data regarding sun/water levels,\nwhere a yellow cell contains sun and a blue cell \ncontains water. Plants will need both in a\n cell to grow.\n\nDarker shades of blue represent higher \nwater levels. Higher leveled plants will require\nmore water to grow.",
          "turns": "Turns",
          "turns_title": "Turns",
          "turns_content": "Pressing 'T' will advance your turn.\nEach turn, the garden will advance by one day.\n\nEach plant will grow by one level if it meets\nits growth requirements from the previous turn.\n\nThe next turn's weather forecast is displayed\nat the top of the screen.",
          "weather": "Weather",
          "weather_title": "Weather",
          "weather_content": "Each day, the weather will change.The weather\naffects the garden's sun/water levels.\n\nThe weather forecast for the next day is displayed\nat the top of the screen.\n\nTable of Weather Effects:\nNormal: No effect\nSunny: Doubled Chances of Sun\nRainy: Doubled Chances of Water\nCloudy: Halved Chances of Sun",
          "back": "Back",
          "game_over": "Game Over",
          "forecast": "Forecast",
          "normal": "Normal",
          "sunny": "Sunny",
          "rainy": "Rainy",
          "cloudy": "Cloudy",
          "plant_fully_grown": "Plant is Fully Grown!",
          "growth_requirements": "Growth Requirements For Level Up",
          "water_level": "Water Level",
          "sun_level": "Sun Level",
          "number_of_neighbors": "Number of Neighbors",
          "plant_info": "Plant Info",
          "species": "Species",
          "max_growth_level": "Max Growth Level",
          "growth_level": "Growth Level",
          "any": "Any",
          "close": "Close",
          "species_lilac": "Lilac",
          "species_daisy": "Daisy",
          "species_tulip": "Tulip",
          "change_language": "Change Language",
          "select_desired_language": "Select Desired Language",
          "show_save_slots": "Show Save Slots",
          "choose_save_slot": "Choose Save Slot",
          "display_save_slot_text": "{{saveSlotDisplayText}}",
          "load": "Load",
          "clear_save_slots": "Clear Save Slots",
        }
      },
      zh: {
        translation: {
          "settings": "设置",
          "resume": "继续",
          "main_menu": "主菜单",
          "play": "玩",
          "tutorial": "教程",
          "credits": "鸣谢",
          "quit": "退出",
          "auto_save_detected": "检测到自动保存",
          "continue_previous_game": "你想继续之前的游戏吗？",
          "yes": "是",
          "no": "否",
          "controls": "控制",
          "controls_title": "控制（键盘）",
          "controls_content": "移动：WASD\n播种/收获植物：箭头键\n前进回合：T\n撤销操作：Z\n重做操作：X\n加载/保存游戏：L",
          "goal": "目标",
          "goal_title": "目标",
          "goal_content": "在花园中收获{{winCondition}}株完全成熟的植物以赢得游戏。\n\n注意每个物种的生长要求。\n\n点击植物查看其生长水平/要求。",
          "garden": "花园",
          "garden_title": "花园",
          "garden_content": "花园由网格系统表示。\n\n每个单元格包含阳光/水分数据，\n黄色单元格表示阳光，蓝色单元格表示水。\n植物需要两者才能生长。\n\n蓝色越深表示水分越多。\n高级植物需要更多水分。",
          "turns": "回合",
          "turns_title": "回合",
          "turns_content": "按'T'键前进回合。\n每回合花园前进一天。\n\n如果植物满足生长要求，\n每株植物将增长一级。\n\n下一回合的天气预报显示在顶部。",
          "weather": "天气",
          "weather_title": "天气",
          "weather_content": "每天，天气会变化。\n天气影响花园的阳光/水分。\n\n下一天的天气预报显示在顶部。\n\n天气效果表：\n正常：无影响\n晴天：阳光几率加倍\n雨天：水分几率加倍\n多云：阳光几率减半",
          "back": "返回",
          "game_over": "游戏结束",
          "forecast": "预报",
          "normal": "正常",
          "sunny": "晴天",
          "rainy": "雨天",
          "cloudy": "多云",
          "plant_fully_grown": "植物完全成熟！",
          "growth_requirements": "升级的生长要求",
          "water_level": "水位",
          "sun_level": "阳光水平",
          "number_of_neighbors": "邻居数量",
          "plant_info": "植物信息",
          "species": "物种",
          "max_growth_level": "最大生长水平",
          "growth_level": "生长水平",
          "any": "任何",
          "close": "关闭",
          "species_lilac": "丁香",
          "species_daisy": "雏菊",
          "species_tulip": "郁金香",
          "change_language": "更改语言",
          "select_desired_language": "选择所需的语言",
          "show_save_slots": "显示保存插槽",
          "choose_save_slot": "选择保存插槽",
          "display_save_slot_text": "{{saveSlotDisplayText}}",
          "load": "加载",
          "clear_save_slots": "清除保存插槽",
        }
      },
      he: {
        translation: {
          "settings": "הגדרות",
          "resume": "המשך",
          "main_menu": "תפריט ראשי",
          "play": "שחק",
          "tutorial": "מדריך",
          "credits": "קרדיטים",
          "quit": "צא",
          "auto_save_detected": "זוהה שמירה אוטומטית",
          "continue_previous_game": "האם ברצונך להמשיך במשחק הקודם?",
          "yes": "כן",
          "no": "לא",
          "controls": "בקרות",
          "controls_title": "בקרות (מקלדת)",
          "controls_content": "תנועה: WASD\nזריעה/קציר צמחים: מקשי חצים\nהתקדם בתור: T\nבטל פעולה: Z\nבצע שוב פעולה: X\nטען/שמור משחק: L",
          "goal": "מטרה",
          "goal_title": "מטרה",
          "goal_content": "קצור {{winCondition}} צמחים בוגרים לחלוטין בגינה כדי לנצח במשחק.\n\nשים לב לדרישות הצמיחה של כל מין.\n\nלחץ על צמח כדי לראות את רמת הצמיחה/דרישותיו.",
          "garden": "גינה",
          "garden_title": "גינה",
          "garden_content": "הגינה מיוצגת על ידי מערכת רשת.\n\nכל תא מכיל נתוני שמש/מים,\nתא צהוב מכיל שמש ותא כחול מכיל מים.\nצמחים צריכים את שניהם כדי לגדול.\n\nגוונים כהים יותר של כחול מציינים יותר מים.\nצמחים ברמה גבוהה יותר צריכים יותר מים.",
          "turns": "תורות",
          "turns_title": "תורות",
          "turns_content": "לחיצה על 'T' תתקדם בתור.\nבכל תור הגינה תתקדם ביום אחד.\n\nאם הצמח עומד בדרישות הצמיחה,\nהוא יגדל ברמה אחת.\n\nתחזית מזג האוויר לתור הבא מוצגת למעלה.",
          "weather": "מזג אוויר",
          "weather_title": "מזג אוויר",
          "weather_content": "מזג האוויר משתנה כל יום.\nמזג האוויר משפיע על רמות השמש/מים בגינה.\n\nתחזית מזג האוויר ליום הבא מוצגת למעלה.\n\nטבלת השפעות מזג האוויר:\nרגיל: אין השפעה\nשמשי: סיכויי שמש כפולים\nגשום: סיכויי מים כפולים\nמעונן: סיכויי שמש מופחתים",
          "back": "חזור",
          "game_over": "סוף המשחק",
          "forecast": "תחזית",
          "normal": "רגיל",
          "sunny": "שמשי",
          "rainy": "גשום",
          "cloudy": "מעונן",
          "plant_fully_grown": "הצמח בוגר לחלוטין!",
          "growth_requirements": "דרישות צמיחה לשדרוג",
          "water_level": "רמת מים",
          "sun_level": "רמת שמש",
          "number_of_neighbors": "מספר שכנים",
          "plant_info": "מידע על הצמח",
          "species": "מין",
          "max_growth_level": "רמת צמיחה מקסימלית",
          "growth_level": "רמת צמיחה",
          "any": "כל",
          "close": "סגור",
          "species_lilac": "לילך",
          "species_daisy": "חיננית",
          "species_tulip": "צבעוני",
          "change_language": "שנה שפה",
          "select_desired_language": "בחר שפה מועדפת",
          "show_save_slots": "הצג חריצי שמירה",
          "choose_save_slot": "בחר חריץ שמירה",
          "display_save_slot_text": "{{saveSlotDisplayText}}",
          "load": "טען",
          "clear_save_slots": "נקה חריצי שמירה",
        }
      }
    },
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    }
  }, (err, t) => {
    if (err) {
      console.error('i18n initialization error:', err);
    } else {
      console.log('i18n initialized');
    }
  });

export default i18n;