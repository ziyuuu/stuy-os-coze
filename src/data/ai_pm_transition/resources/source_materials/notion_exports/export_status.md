# Export Status

Updated: 2026-04-27

## Current Correction

The first Notion import only created source inventories and links. This correction starts copying fetched Notion page bodies into local Markdown files.

## Completed Page Body Exports

- `02_gemini_outputs/Gemini产出.page.md`
- `03_coursera_courses/coursera课程.page.md`
- `04_product_management_playbook/我的产品管理Playbook1.0.0.page.md`
- `05_long_term_learning_system/长期学习系统.page.md`
- `05_long_term_learning_system/docs/产品原则.page.md`
- `05_long_term_learning_system/docs/学习Agent成功指标定义_v1.0.page.md`
- `05_long_term_learning_system/docs/问题简报.page.md`
- `05_long_term_learning_system/docs/筛选资料.page.md`
- `05_long_term_learning_system/docs/长期记忆.page.md`
- `05_long_term_learning_system/prd/长期学习系统_V0.04.page.md`
- `06_learning_library/学习图书馆.page.md`

## Pending Page Body Exports

- `01_gemini_learning_plan/GEMINI学习计划.page.md`
- Database child pages listed in each inventory file.

## Known Connector Limits

- The Notion database SQL query tool returned `notion-query-data-sources not found`.
- Large page fetches can exceed the visible tool-output limit in this chat; those pages need chunked/manual export or Notion-native export if exact full fidelity is required.
