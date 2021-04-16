const { response } = require('express');
var express = require('express');
var router = express.Router();
var producthelpers=require('../helpers/producthelpers')
var userhelpers=require('../helpers/userhelpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  console.log(user)
  let cartcount=null
  if(req.session.user){
   cartcount=await userhelpers.getcartcount(req.session.user._id)
  }
  producthelpers.getallproducts().then((products)=>{
    
    res.render('user/viewproducts',{products,user,cartcount})
  })
  
});
router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else
res.render('user/login',{"loginErr":req.session.userloginErr})
req.session.userloginErr=false
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
userhelpers.doSignup(req.body).then((response)=>{
  console.log(response)
 
  
  
  req.session.user=response
  req.session.user.loggedIn=true
  res.redirect('/')

})
})
router.post('/login',(req,res)=>{
  userhelpers.doLogin(req.body).then((response)=>{
    if(response.status){
     
      req.session.user=response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }
    else{
      req.session.userloginErr="inalid username or password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await userhelpers.getcartproducts(req.session.user._id)
  let totalval=await userhelpers.gettotalamount(req.session.user._id)
  console.log(products)
  res.render('user/cart',{products,user:req.session.user._id,totalval})
})

router.get('/addtocart/:id',(req,res)=>{
  console.log("api call")
  userhelpers.addtocart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  userhelpers.changeproductquantity(req.body).then(async(response)=>{
    response.total=await userhelpers.gettotalamount(req.body.user)
    res.json(response)

  })
})
router.get('/placeorder',verifyLogin,async(req,res)=>{
  let total=await userhelpers.gettotalamount(req.session.user._id)
  res.render('user/placeorder',{total,user:req.session.user})
})
router.post('/remove',(req,res)=>{
userhelpers.removeproduct(req.body).then((response)=>{
  res.json(response)
})
})
router.post('/placeorder',async(req,res)=>{
  let products=await userhelpers.getcartproductlist(req.body.userId)
  let totalprice=await userhelpers.gettotalamount(req.body.userId)
  userhelpers.placeorder(req.body,products,totalprice).then((orderId)=>{
    if(req.body['paymentmethod']==='COD')
    {
    res.json({codsuccess:true})
    }
    else{
      userhelpers.generaterazorpay(orderId,totalprice).then((response)=>{
        res.json(response)
      })
    }
  })
  console.log(req.body)
})
router.get('/ordersuccess',(req,res)=>{
  res.render('user/ordersuccess',{user:req.session.user})
})
router.get('/orders',async(req,res)=>{
  let orders=await userhelpers.getuserorders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})

})
router.get('/vieworderproducts/:id',async(req,res)=>{
  let products=await userhelpers.getorderproducts(req.params.id)
  res.render('user/vieworderproducts',{user:req.session.user,products})
})
router.post('/verifypayment',(req,res)=>{
  console.log(req.body)
  userhelpers.verifypayment(req.body).then(()=>{
    userhelpers.changepaymentstatus(req.body['order[receipt]']).then(()=>{
      console.log("payment success")
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
})

module.exports = router;
