// ── sections/registry.js ─────────────────────────────────────────────────
// Maps each tab `type` in site.config.json to its renderer. To add a new
// section type: create the component in this folder and register it here.

import MusicSection from './MusicSection.jsx'
import ProjectsSection from './ProjectsSection.jsx'
import SkillsSection from './SkillsSection.jsx'
import TextSection from './TextSection.jsx'

export const SECTION_TYPES = {
  text: TextSection,
  skills: SkillsSection,
  music: MusicSection,
  projects: ProjectsSection,
}
