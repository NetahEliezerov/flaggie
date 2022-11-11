type Player = {
    name: string;
    points: number;
};

type Game = {
    id: string;
    players: Player[];
    inGame: boolean;
    currentGameFlag?: string;
};

type RoomInfo = {
    roomId: string;
    name: string;
};

enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EXPERT = 'expert'
};

type Country = {
    name: string;
    code: string;
    difficulty: Difficulty;
};

export {
    Game,
    RoomInfo,
    Difficulty,
    Country
};