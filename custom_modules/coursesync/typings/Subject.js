/**
 * @typedef {{
 *      metadata: {
 *          subject: string,
 *          abbreviation: string,
 *          common: string[],
 *      },
 *      listings: Map<CourseNumber, CourseListing>
 * }} Subject
 * 
 * @typedef {{
 *      name: string
 *      credits: string,
 *      description: string,
 *      link: number | null,
 *      taughtWith: number | null,
 *}} CourseListing
 * 
 * @typedef {'ASTR' | 'BCHE' | 'BIOL' | 'CHEM' | 'CS' | 'ENGL' | 'HIST' | 'JPNS'} SupportedClasses
 */