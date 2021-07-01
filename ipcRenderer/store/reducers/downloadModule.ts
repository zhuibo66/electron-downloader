import { Update } from '../actions/index';
class downloadModule {
    userName: string;
    constructor() {
        this.userName = 'test';
    }

    @Update
    update() {}

    setUserName(name) {
        this.userName = name;
        this.update();
    }
}

export default new downloadModule();
