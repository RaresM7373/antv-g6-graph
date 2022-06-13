import registerMessage from './message';
import registerButton from './button';

export default (...opts) => {
    registerMessage(...opts);
    registerButton(...opts);
};
