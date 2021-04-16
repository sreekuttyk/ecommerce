const { Router } = require('express');
var express = require('express');

var router = express.Router();
var producthelpers=require('../helpers/producthelpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  
  producthelpers.getallproducts().then((products)=>{
    console.log(products)
    res.render('admin/viewproducts',{admin:true,products})
  })
  
});
router.get('/addproduct',function(req,res){
  res.render('admin/addproduct')

})
router.post('/addproduct',(req,res)=>{
  
  producthelpers.addproduct(req.body,(id)=>{
    let image=req.files.Image
    console.log(id);
    image.mv('./public/productimages/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/addproduct")
      }else{
          console.log(err)
        }
      
    })
    
  })
})
router.get('/deleteproduct/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId)
  producthelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})
router.get('/editproduct/:id',async(req,res)=>{
  let product=await producthelpers.getproductdetails(req.params.id)
  console.log(product)
  res.render('admin/editproduct',{product})
})
router.post('/editproduct/:id',(req,res)=>{
  let id=req.params.proId
  producthelpers.updateproduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/productimages/'+id+'.jpg')
        
      
    }
  })

})

module.exports = router;
