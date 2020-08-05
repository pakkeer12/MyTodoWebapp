require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect(process.env.CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);


const item1 = new Item({
  name: "Welcome to TodoList!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});


const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3]


app.get("/", function(req, res) {
  Item.find(function(err, founditems) {
    if (err) {
      console.log(err);
    } else {
      if (founditems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved defaultItems to DB");
          }
        });
        res.redirect("/");
      } else {
        res.render('list', {
          whichDay: "Today",
          NewItem: founditems
        });
      }
    }

  });

});

app.get("/:customListener", function(req, res) {
  const customListener = _.capitalize(req.params.customListener);

  List.findOne({
    name: customListener
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const listitem = new List({
          name: customListener,
          items: defaultItems
        });
        listitem.save();
        res.redirect("/" + customListener);
      } else {
        res.render('list', {
          whichDay: foundList.name,
          NewItem: foundList.items
        });
      }
    }
  });

});



app.post("/delete", function(req, res) {
  const checkboxId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkboxId, function(err) {
      if (err) {
        console.log(err);
      } else {

        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkboxId}}}, function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });

  }

});

app.post("/", function(req, res) {
  var itemName = req.body.newlist;
  var listName = req.body.submit;

  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
    setTimeout(function(){ res.redirect("/"); }, 300);
  }else{
    List.findOne({name: listName},function(err,foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save();
        setTimeout(function(){ res.redirect("/"+listName); }, 300);
      }
    });
  }

});

app.listen( process.env.PORT || "3000", function() {
  console.log("Server has started succesfully");
});
