const express = require('express');
const router = express.Router();

router.get('/', (req,res) => {
    res.status(200).json({
        message: 'this is admin get'
    });
});

router.post('/add/grama', (req,res) => {

    const gramaNiladhari = {
        fName:req.body.fName,
        lName:req.body.lName,
        email:req.body.email,
        conNumber:req.body.conNumber
        
    };

    res.status(200).json({
        message: 'added grama niladhari',
        createdGrama: gramaNiladhari
    });
});

router.get('/:gramaId',(req,res) => {
    const id = req.params.gramaId
    if(id == 'special'){
        res.status(200).json({
            message: 'discoverd grama',
            id : id
        });
    }else {
        res.status(200).json({
            message : 'no'    
        });
    }
});


module.exports = router;