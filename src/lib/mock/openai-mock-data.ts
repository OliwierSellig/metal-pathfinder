import type { OpenAIRecommendationResponse, OpenAIArtistBioResponse, AITrackRecommendation } from "../../types";

/**
 * Mock data for OpenAI API responses
 * Contains realistic AI-generated recommendations and biographies for development
 */

// Mock AI recommendations based on different base tracks
export const MOCK_AI_RECOMMENDATIONS: Record<string, AITrackRecommendation[]> = {
  // For Master of Puppets (Metallica)
  "4uLU6hMCjMI75M1A2tKUQC": [
    {
      song_title: "Stairway to Heaven",
      artist_name: "Led Zeppelin",
      reasoning:
        "This epic progressive rock masterpiece shares the same ambitious song structure and atmospheric build-up as Master of Puppets, with both tracks showcasing complex arrangements and powerful emotional crescendos.",
      confidence: 0.89,
    },
    {
      song_title: "Iron Man",
      artist_name: "Black Sabbath",
      reasoning:
        "A foundational heavy metal track that helped establish the genre, featuring the heavy riffing and dark themes that influenced Metallica's approach to metal songwriting.",
      confidence: 0.92,
    },
    {
      song_title: "Breaking the Law",
      artist_name: "Judas Priest",
      reasoning:
        "This track exemplifies the precision and technical prowess that Metallica would later master, with its tight rhythmic structure and aggressive energy matching the intensity of thrash metal.",
      confidence: 0.87,
    },
    {
      song_title: "Angel of Death",
      artist_name: "Slayer",
      reasoning:
        "A thrash metal masterpiece that shares the same era and aggressive approach as Master of Puppets, featuring complex rhythms and uncompromising intensity.",
      confidence: 0.94,
    },
    {
      song_title: "War Pigs",
      artist_name: "Black Sabbath",
      reasoning:
        "Another Black Sabbath classic that combines heavy riffing with social commentary, similar to how Master of Puppets addresses themes of control and manipulation.",
      confidence: 0.85,
    },
    {
      song_title: "Crazy Train",
      artist_name: "Ozzy Osbourne",
      reasoning:
        "Features the same kind of memorable riffing and powerful vocals that made Metallica's work so influential, with both tracks being essential metal anthems.",
      confidence: 0.83,
    },
    {
      song_title: "Ace of Spades",
      artist_name: "Motörhead",
      reasoning:
        "This high-energy track captures the raw power and speed that influenced the thrash metal movement, making it a perfect companion to Master of Puppets.",
      confidence: 0.88,
    },
    {
      song_title: "Cemetery Gates",
      artist_name: "Pantera",
      reasoning:
        "Showcases the technical precision and emotional depth that characterized 90s metal, building on the foundation that Metallica helped establish.",
      confidence: 0.81,
    },
    {
      song_title: "Holy Wars... The Punishment Due",
      artist_name: "Megadeth",
      reasoning:
        "A thrash metal epic that matches the complexity and intensity of Master of Puppets, featuring intricate songwriting and powerful social commentary.",
      confidence: 0.93,
    },
  ],

  // For Paranoid (Black Sabbath)
  "1t2qKa8K72IBC8yQlhD9bU": [
    {
      song_title: "Iron Man",
      artist_name: "Black Sabbath",
      reasoning:
        "Another Black Sabbath classic from the same era, featuring the same heavy, doom-laden atmosphere and Tony Iommi's iconic guitar work.",
      confidence: 0.95,
    },
    {
      song_title: "War Pigs",
      artist_name: "Black Sabbath",
      reasoning:
        "From the same legendary album, this track shares the dark themes and heavy sound that defined early heavy metal.",
      confidence: 0.94,
    },
    {
      song_title: "Breaking the Law",
      artist_name: "Judas Priest",
      reasoning:
        "Represents the evolution of heavy metal that Black Sabbath pioneered, with more refined production but maintaining the core heavy sound.",
      confidence: 0.86,
    },
    {
      song_title: "Ace of Spades",
      artist_name: "Motörhead",
      reasoning:
        "Captures the raw energy and heavy sound that Black Sabbath helped create, with a faster, more aggressive approach to heavy rock.",
      confidence: 0.84,
    },
    {
      song_title: "Crazy Train",
      artist_name: "Ozzy Osbourne",
      reasoning:
        "Features Ozzy's continuation of the heavy metal sound he helped create with Black Sabbath, maintaining the dark energy and powerful vocals.",
      confidence: 0.88,
    },
  ],
};

// Mock artist biographies
export const MOCK_ARTIST_BIOS: Record<string, string> = {
  "Led Zeppelin":
    "Led Zeppelin revolutionized rock music by incorporating heavy blues influences and pioneering the use of complex, multi-layered compositions. While not strictly metal, their heavy sound and mystical themes laid crucial groundwork for the genre, influencing countless metal bands with their powerful riffing and dynamic song structures.",

  "Black Sabbath":
    "Widely regarded as the pioneers of heavy metal, Black Sabbath created the blueprint for the genre with their dark, heavy sound and doom-laden atmosphere. Tony Iommi's innovative guitar work, combined with Ozzy Osbourne's haunting vocals, established the sonic foundation that all subsequent metal bands would build upon.",

  "Judas Priest":
    "Judas Priest refined and codified the heavy metal sound, introducing the iconic twin guitar attack and leather-and-studs aesthetic that became synonymous with metal culture. Rob Halford's operatic vocals and the band's precision playing elevated metal to new levels of technical sophistication.",

  Slayer:
    "Slayer pushed thrash metal to its most extreme limits, creating brutally fast and aggressive music that influenced the development of death metal and black metal. Their uncompromising approach and technical precision made them one of the 'Big Four' thrash bands and pioneers of extreme metal.",

  Metallica:
    "Metallica brought thrash metal to mainstream audiences while never compromising their core sound. Their combination of technical prowess, memorable songwriting, and powerful production helped define what modern metal could be, influencing generations of metal musicians.",

  "Ozzy Osbourne":
    "As both the frontman of Black Sabbath and a successful solo artist, Ozzy Osbourne became the archetypal metal frontman. His theatrical stage presence and distinctive vocals helped establish metal as a theatrical, larger-than-life genre that could both frighten and entertain.",

  Motörhead:
    "Motörhead bridged the gap between punk and metal, creating a raw, high-energy sound that influenced both genres. Lemmy's distinctive bass playing and songwriting created anthems that captured the rebellious spirit of heavy music while maintaining an unpolished, authentic edge.",

  Pantera:
    "Pantera pioneered groove metal by combining thrash metal's aggression with a more rhythmic, groove-oriented approach. Their technical precision and innovative guitar work helped define 90s metal and influenced countless modern metal bands.",

  Megadeth:
    "Formed by ex-Metallica guitarist Dave Mustaine, Megadeth brought a more technically complex and politically charged approach to thrash metal. Their intricate compositions and virtuosic playing raised the bar for technical proficiency in metal music.",
};

/**
 * Generate mock AI recommendations based on base track
 */
export function generateMockRecommendations(baseTrackId: string, count = 10): OpenAIRecommendationResponse {
  const recommendations = MOCK_AI_RECOMMENDATIONS[baseTrackId] || [
    {
      song_title: "Iron Man",
      artist_name: "Black Sabbath",
      reasoning: "A classic heavy metal track that exemplifies the genre's core characteristics.",
      confidence: 0.85,
    },
    {
      song_title: "Breaking the Law",
      artist_name: "Judas Priest",
      reasoning: "A high-energy metal anthem with excellent riffing and memorable hooks.",
      confidence: 0.82,
    },
  ];

  return {
    recommendations: recommendations.slice(0, count),
  };
}

/**
 * Generate mock artist biography
 */
export function generateMockArtistBio(artistName: string): OpenAIArtistBioResponse {
  const biography =
    MOCK_ARTIST_BIOS[artistName] ||
    `${artistName} is a significant artist in the metal music scene, known for their distinctive sound and contribution to the genre. Their music showcases the power and complexity that defines great metal, with innovative approaches to songwriting and performance that have influenced many other artists in the field.`;

  return { biography };
}

/**
 * Simulate AI generation delay for realistic behavior
 */
export function simulateAIDelay(): Promise<void> {
  const delay = Math.random() * 2000 + 1000; // 1-3 seconds
  return new Promise((resolve) => setTimeout(resolve, delay));
}
