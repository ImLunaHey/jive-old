import { MessageEmbed } from "discord.js";

const topics = [
    'Have you ever been to a five star resort?',
    'Have you ever kept a secret for more than a decade?',
    'How do you think the world would be if bananas were illegal?',
    'How would you want to be remembered?',
    'If you could be best friends with a celebrity, who would it be?',
    'If you could erase one event from history, which one would you erase?',
    'If you could have any super power, which one would you choose?',
    'If you could interview a famous person, who would you choose?',
    'If you could only use one word the rest of your life, what word would you choose?',
    'If you could trade lives with someone, who would it be?',
    'If you found $50k on the ground, what would you do with it?',
    'If you had three wishes, what would you wish for?',
    'If you were invited to attend hogwarts, which hogwarts house would you choose?',
    'If you were to play a song you love right now, what would it be?',
    'If your food is bad at a restaurant, would you say something?',
    'Is it difficult to do what you do? (for a living, hobby etc.)',
    'What are your dreams and ambitions?',
    'What talent would you want to possess if you could?',
    'What was your fondest memory of high school?',
    'What were the highlights of your childhood?',
    'What would be the perfect crime?',
    'What would you do if you could possess the abilities of your pet?',
    'What would you do with 10 million dollars?',
    'Who is your favourite celebrity?',
    'Would you rather be able to control time, or be able to know what other people are thinking?',
    'Would you rather look like a potato, or feel like a potato?',
    "If you had the world's attention for 30 seconds, what would you say?",
    "What's the funniest thing you've seen on the news?",
    "What's the funniest way you've ever broken the law?",
    "What's the most beautiful place you've ever seen?",
    "What's the most important thing you've learned from a celebrity?",
    "What's the strangest thing in your refrigerator?",
    "What's the stupidest thing you've ever done?",
    "What's your favorite movie?",
    "What's your favorite sports team?",
    "What's your favorite tv show?",
    "What's your favourite pizza topping?",
    "You've been given an elephant that you can't get rid of. What would you do with it?"
];

export const getRandomTopic = () => topics[Math.floor((Math.random() * topics.length))];

export const createRandomTopicMessage = () => ({
    content: '<@&1005378317563736105>',
    embeds: [new MessageEmbed({
        title: 'Chat Revival',
        description: `If you don't know what to talk about, here's a random topic.\n\n**__${getRandomTopic()}__**`,
        footer: {
            text: `To generate these manually use \`/revive-chat\`.`
        },
        color: 'LUMINOUS_VIVID_PINK'
    })]
});
