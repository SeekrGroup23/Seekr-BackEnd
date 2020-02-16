const express = require("express");
const router = express.Router();
const msgLogger = require("../modules/message-logger");
const db = require("../../config/firebase");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const url = require("url");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodeMailer = require("nodemailer");
const moment = require("moment");
const multer = require("multer");



// Add New Admin
router.post("/create", (req, res, next) => {});

// View All Admins
router.get("/all", (req, res, next) => {});

// View Individual Admin Profile Info
router.get("/", (req, res, next) => {
    console.log("h")
});

// Update Admin Info
router.put("/:id", (req, res, next) => {});

// Delete an Admin
router.delete("/:id", (req, res, next) => {});

//get gramaniladhari count

router.get("/gramacount",(req,res,next)=>{
    console.log("kkk");
    db.collection("gramaniladhari").where("isDeleted", "==", false).get().then(function(querySnapshot){
      var y = querySnapshot.size;
      var c = y.toString();
      //var m = "Hello";
      //console.log(c);
      res.send(c);
      //res.send(typeof(c));
    })
})

//get registerd patient count

router.get("/patientcount",(req,res,next)=>{
    console.log("kkk");
    db.collection("patients").where("isDeleted", "==", false).get().then(function(querySnapshot){
      var y = querySnapshot.size;
      var c = y.toString();
      //var m = "Hello";
      //console.log(c);
      res.send(c);
      //res.send(typeof(c));
    })
})

//get hospital count

router.get("/hospitalcount",(req,res,next)=>{
    console.log("kkk");
    db.collection("hospitals").where("isDeleted", "==", false).get().then(function(querySnapshot){
      var y = querySnapshot.size;
      var c = y.toString();
      //var m = "Hello";
      //console.log(c);
      res.send(c);
      //res.send(typeof(c));
    })
})

//get donor count

router.get("/donorcount",(req,res,next)=>{
    console.log("kkk");
    db.collection("donors").where("isDeleted", "==", false).get().then(function(querySnapshot){
      var y = querySnapshot.size;
      var c = y.toString();
      //var m = "Hello";
      //console.log(c);
      res.send(c);
      //res.send(typeof(c));
    })
})

//get pateint count district 

router.get("/districtpatientcount",(req,res,next) => {
    
    var count = 0;
    let ptRef = db.collection("patients");
    var sortable = []
    var xx = []
    var m
    /* let arr = ["Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha","Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala","Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya","Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya"]; */
    var arrm = {"Ampara" : 0,"Anuradhapura":0,"Badulla":0,"Batticaloa":0,"Colombo":0,"Galle":0,"Gampaha":0,"Hambantota":0,"Jaffna":0,"Kalutara":0,"Kandy":0,"Kegalle":0,"Kilinochchi":0,"Kurunegala":0,"Mannar":0,"Matale":0,"Matara":0,"Monaragala":0,"Mullaitivu":0,"Nuwara Eliya":0,"Polonnaruwa":0,"Puttalam":0,"Ratnapura":0,"Trincomalee":0,"Vavuniya":0};
    let query = ptRef
    .get()
    .then(snapshot => {
        snapshot.forEach(doc =>{
            arrm[doc.data().district] = arrm[doc.data().district]+1;
        })
        //res.send(arrm);
        for (var x in arrm) {
            sortable.push([x, arrm[x]]);
            m = {
                district:x,
                count:arrm[x]
            }
            xx.push(m);
           /*  xx.district = x,
            xx.count = arrm[x] */
        }
        
        /* sortable.sort(function(a, b) {
            return b[1] - a[1];
        }); */
        console.log(xx);
        res.send(sortable);
    }).catch(err =>{
        console.log("Eror",err)
        
    })
})




// function for count age

function getAge(dateString) {
    var arr = dateString.split("-");
    var dob = arr[2]+ "-" + arr[1]+ "-"+arr[0];
    var today = new Date();

    var birthDate = new Date(dob.toString());
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}


// Bar Plot for Patient Age
router.get("/patient_age_bar_plot",(req,res,next) => {

    let ptRef = db.collection("patients");
    var sortable = []
    var dis
    var arrm = {"Children" : 0,"Youth":0,"Adults":0,"Seniors":0};
    let query = ptRef
    .where("isDeleted", "==", false).get()
    .then(snapshot => {
        snapshot.forEach(doc =>{

            if(getAge(doc.data().dob) > 0 && getAge(doc.data().dob) <= 14){
                arrm.Children = arrm.Children + 1;
            }else if(getAge(doc.data().dob) >= 15 && getAge(doc.data().dob) <= 24){
                arrm.Youth = arrm.Youth + 1;
            } else if(getAge(doc.data().dob) >= 25 && getAge(doc.data().dob) <= 64){
                arrm.Adults = arrm.Adults + 1;
            } else if(getAge(doc.data().dob) >= 65){
                arrm.Seniors = arrm.Seniors + 1;
            }
            //console.log(arrm);
        })
        for (var x in arrm) {
            sortable.push([x, arrm[x]]);
        }
        
        res.send(sortable);
    }).catch(err =>{
        console.log("Eror",err)
        
    })
})

//get patient count province 
router.get("/provincepatientcount",(req,res,next) => {
    
    var count = 0;
    let ptRef = db.collection("patients");
    var sortable = []
    var arrm = {"Western":0,"Eastern":0,"Southern":0,"Nothern":0,"Uva":0,"North-Central":0,"Sabaragamuwa":0,"Central":0,"North-Western":0};
    let query = ptRef
    .get()
    .then(snapshot => {
        snapshot.forEach(doc =>{
            arrm[doc.data().province] = arrm[doc.data().province]+1;
        })
        for (var x in arrm) {
            sortable.push([x, arrm[x]]);
        }
        res.send(sortable);
    }).catch(err =>{
        console.log("Eror",err)
        
    })
})



//get data for district report
router.get("/districtpatientcountreport",(req,res,next) => {

    let ptRef = db.collection("patients");
    var collectiondistrict = []
    var dis
    var arrm = {"Ampara" : 0,"Anuradhapura":0,"Badulla":0,"Batticaloa":0,"Colombo":0,"Galle":0,"Gampaha":0,"Hambantota":0,"Jaffna":0,"Kalutara":0,"Kandy":0,"Kegalle":0,"Kilinochchi":0,"Kurunegala":0,"Mannar":0,"Matale":0,"Matara":0,"Monaragala":0,"Mullaitivu":0,"Nuwara Eliya":0,"Polonnaruwa":0,"Puttalam":0,"Ratnapura":0,"Trincomalee":0,"Vavuniya":0};
    let query = ptRef
    .get()
    .then(snapshot => {
        snapshot.forEach(doc =>{
            arrm[doc.data().district] = arrm[doc.data().district]+1;
        })
        for (var x in arrm) {
            dis = {
                district:x,
                count:arrm[x]
            }
            collectiondistrict.push(dis);
        }
        res.send(collectiondistrict);
    }).catch(err =>{
        console.log("Eror",err)
        
    })
})

//get data for province report
router.get("/provincepatientcountreport",(req,res,next) => {

    let ptRef = db.collection("patients");
    var collectionpro = []
    var pro
    var arrm = {"Western":0,"Eastern":0,"Southern":0,"Nothern":0,"Uva":0,"North-Central":0,"Sabaragamuwa":0,"Central":0,"North-Western":0};
    let query = ptRef
    .get()
    .then(snapshot => {
        snapshot.forEach(doc =>{
            arrm[doc.data().province] = arrm[doc.data().province]+1;
        })
        for (var x in arrm) {
            pro = {
                province:x,
                count:arrm[x]
            }
            collectionpro.push(pro);
        }
        res.send(collectionpro);
    }).catch(err =>{
        console.log("Eror",err)
        
    })
})

module.exports = router;

