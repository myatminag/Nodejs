const sum = (a, b) => {
    if (a && b) {
        return a + b;
    }
    throw new Error('Invalid Arguments');
};

try {
    console.log(sum(1));
} catch (error) {
    console.log('Error Occurred!');
    console.log(error);
}
