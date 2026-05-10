require('dotenv').config();

const connectDB = require('./src/config/database');


const app = require('./src/app');
const port = process.env.PORT || 3000;

connectDB();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});