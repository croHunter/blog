import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path from 'path';
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/build')));

mongoose.connect("mongodb+srv://SJ_admin:sujan1227420@blog.rncaz.mongodb.net/blog", { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log(`connection to database established`)).catch((err) => {
    console.log(`db error ${err.message}`);
    process.exit(1);
});

const articleSchema = mongoose.Schema({
    author: String,
    title: {
        type: String,
        required: [true, "Please check your data entry, no name is specified."]
    },
    content: {
        type: String,
        required: [true, "Please check your data entry, no name is specified."]
    },
    date: { type: Date, default: Date.now },
    comments: [{ username: String, comment: String }],
    upvotes: Number,
});
const ArticleModel = mongoose.model("articlelists", articleSchema);

app.get("/api/articlelists", (req, res) => {
    ArticleModel.find({}, function (err, found) {
        if (err) { console.log("ERROR :" + err); }
        res.status(200).json(found);
    }
    );
});

const findOneDoc = (id, res) => {
    ArticleModel.findOne({ _id: id }, function (err, found) {
        if (err) { console.log("ERROR :" + err); }
        res.status(200).json(found);
    }
    );
}

app.get("/api/articlelists/:id", (req, res) => {
    const id = req.params.id;
    findOneDoc(id, res);
});


app.post("/api/compose", (req, res) => {
    const { author, title, content } = req.body;
    const newArticle = new ArticleModel({
        author: author,
        title: title,
        content: content,
        comments: [],
        upvotes: 0,
    });
    newArticle.save((err) => {
        if (err) {
            console.log("error in inserting article : " + err)
        }
        else {
            console.log("inserted successfully");
            res.status(200).send("Article has submited successfully");
        }
    });
})

app.post("/api/articlelists/:id/upvote", async (req, res) => {
    const articleId = req.params.id;
    console.log(articleId);
    await ArticleModel.findOne({ _id: articleId }, (err, found) => {
        const upvotes = found.upvotes + 1;
        if (err) console.log("error" + err);
        ArticleModel.updateOne({ _id: articleId }, { upvotes: upvotes }, (err) => {
            if (err) {
                console.log("ERROR :" + err);
            } else {
                console.log("upvote is updated successfully");

            }
        });

    });
    findOneDoc(articleId, res);

});



app.post("/api/articlelists/:id/add-comment", async (req, res) => {
    const articleId = req.params.id;
    const { username, comment } = req.body;
    await ArticleModel.findOne({ _id: articleId }, (err, found) => {
        const comments = found.comments.concat({ username, comment });

        if (err) console.log("error" + err);
        ArticleModel.updateOne({ _id: articleId }, { comments: comments }, (err) => {
            if (err) {
                console.log("ERROR :" + err);
            } else {
                console.log("comments is updated successfully");
            }
        });
        findOneDoc(articleId, res);
    });
});
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})


const gracefulExit = () => {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection with DB. Db server is disconnected through app termination');
        process.exit(0);
    });
}

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);



let port = process.env.PORT;
if (port == null || port == "") {
    port = 8000;
}
app.listen(port, () => console.log("Listening to port 8000..."));