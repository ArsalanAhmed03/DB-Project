const express = require('express');
const path = require('path');
const multer = require("multer");
const bodyParser = require("body-parser");
const {error}= require('console');
const port = 80;
const cookieParser = require('cookie-parser');
const upload = multer({storage:multer.memoryStorage()});

const {createPool} = require('mysql2');

const mysql = createPool({
host: 'localhost',
user: 'root',
password: 'Arsalan5122003_A',
database: 'DB_Project',
connectionLimit: 100
});



const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.json());

// endpoints
app.use(express.urlencoded({ extended: true }));

app.use('/css',express.static(__dirname+'/css'));

app.use('/images',express.static(__dirname+'/images'));

app.use('/src',express.static(__dirname+'/src'));

app.use('/fonts',express.static(__dirname+'/fonts'));

const public_dir = path.join(__dirname,'src');

app.set('views', path.join(__dirname, 'src'));

app.get('/', async (req, res) => {
    try {
        const loggedIn = req.cookies.SignedIn === 'true';
        const isSeller = req.cookies.IS_SELLER === 'true';

        const sectionProducts = [];
        const sectionCart = [];
        const sectionFavourite = [];

        const categories = [
            { name: 'All', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 LIMIT 4' },
            { name: 'Best Sellers', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0  ORDER BY totalsales LIMIT 4' },
            { name: 'New Releases', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0  ORDER BY EntryDate LIMIT 4' },
            { name: 'Books', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 AND Category = "Books"' },
            { name: 'Home Garden', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 AND  Category = "Home Garden" LIMIT 4' },
            { name: 'PC & Video Games', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 AND  Category = "PC & Video Games" LIMIT 4' },
            { name: 'PC', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 AND  Category = "PC" LIMIT 4' },
            { name: 'Electronics', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 AND  Category = "Electronics" LIMIT 4' },
            { name: 'Toys & Games', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 AND  Category = "Toys & Games" LIMIT 4' },
            { name: 'Beauty', query: 'SELECT * FROM Products WHERE QuantityAvailable > 0 AND  Category = "Beauty" LIMIT 4' }
        ];

        const get_cart = 'select P.product_img,P.ProductID,P.Name,P.Price,C.quantity,C.UserID from Cart as C Join Products as P ON C.ProductID = P.ProductID WHERE QuantityAvailable > 0 AND C.UserID = ?;';
        const UserID = req.cookies.UserId;
        const [cart_items] = await mysql.promise().query(get_cart,[UserID]);
        sectionCart.push({cart_items:cart_items});

        const get_fav = 'select Pro.ProductID,Pro.product_img,Pro.Name,Pro.Price from WishList_U as U Join WishList_P as P ON U.WishListID = P.WishListID JOIN Products as Pro ON P.ProductID = Pro.ProductID where U.UserID = ?';
        const [fav_items] = await mysql.promise().query(get_fav,[UserID]);
        sectionFavourite.push({fav_items:fav_items});

        for (const category of categories) {
            const [products] = await mysql.promise().query(category.query);
            sectionProducts.push({ section: category.name, products: products });
        }

        res.render('Index', { 
            loggedin: loggedIn ? 'true' : 'false', 
            IS_SELLER: isSeller ? 'true' : 'false', 
            sectionProducts: sectionProducts,
            sectionCart: sectionCart,
            sectionFavourite: sectionFavourite
        });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).send('Error retrieving products');
    }
});

app.get('/search_item',(req,res)=>{
    const loggedIn = req.cookies.SignedIn === 'true';
    const isSeller = req.cookies.IS_SELLER === 'true';
    const search_term_o = req.cookies.search_term;
    const search_term = '%' + search_term_o + '%';
    if(req.cookies.filter_term && req.cookies.filter_term !== 'Best Match'){
        const filter = req.cookies.filter_term;
        res.clearCookie('filter_term');
        let filter_query = 'select * from Products where QuantityAvailable > 0 AND Name LIKE ? OR short_Description LIKE ?';
        if(filter === 'Top Sales'){
            filter_query += ' ORDER BY totalsales';
        }
        else if(filter === 'Price High to Low'){
            filter_query += ' ORDER BY Price DESC';
        }
        else if(filter === 'Price Low to High'){
            filter_query += ' ORDER BY Price';
        }
        else{
            filter_query += ' ORDER BY EntryDate';
        }

        mysql.query(filter_query,[search_term,search_term],(err,all_products)=>{
            if(err){
                console.log(err);
            }
            else{
                res.render('search_page', { 
                    loggedin: loggedIn ? 'true' : 'false', 
                    IS_SELLER: isSeller ? 'true' : 'false',
                    all_products:all_products,
                    search_term:search_term_o
                });
            }
        });

    }
    else{
        const search_query = 'select * from Products where Name LIKE ? OR short_Description LIKE ?';
        mysql.query(search_query,[search_term,search_term],(err,all_products)=>{
            if(err){
                console.log(err);
            }
            else{
                res.render('search_page', { 
                    loggedin: loggedIn ? 'true' : 'false', 
                    IS_SELLER: isSeller ? 'true' : 'false',
                    all_products:all_products,
                    search_term:search_term_o
                });
            }
        });
    }
});

app.get('/UpdateProduct',(req,res)=>{
    const UID = req.cookies.UserId;
    const loggedIn = req.cookies.SignedIn === 'true';
    const isSeller = req.cookies.IS_SELLER === 'true';
    const SID = req.cookies.SellerID;
    
    const search_query = 'select * from Products where SellerID = ?';
    mysql.query(search_query,[SID],(err,all_products)=>{
        if(err){
            console.log(err);
        }
        else{
            res.render('Inventory_Management', { 
                loggedin: loggedIn ? 'true' : 'false', 
                IS_SELLER: isSeller ? 'true' : 'false',
                all_products:all_products
            });
        }
    });
    
});

app.get('/product_page',(req,res)=>{
    const loggedIn = req.cookies.SignedIn === 'true';
    const isSeller = req.cookies.IS_SELLER === 'true';
    const pID = parseInt(req.cookies.AlldetailProduct);
    const get_all_details = 'select * from Products WHERE ProductID = ?';
    mysql.query(get_all_details,[pID],(err,respon)=>{
        if(err){
            console.log('error');
        }
        else{
            res.render('Product_detail', { 
                loggedin: loggedIn ? 'true' : 'false', 
                IS_SELLER: isSeller ? 'true' : 'false',
                product:respon
            });
        }
    });

});

app.get('/CheckOut', async (req,res)=>{
    const loggedIn = req.cookies.SignedIn === 'true';
    const isSeller = req.cookies.IS_SELLER === 'true';
    const sectionCart = [];
    const Payments = [];
    const get_cart = 'select P.product_img,P.ProductID,P.Name,P.Price,C.quantity,C.UserID from Cart as C Join Products as P ON C.ProductID = P.ProductID WHERE C.UserID = ?;';
    
    const UserID = req.cookies.UserId;
    const [cart_items] = await mysql.promise().query(get_cart,[UserID]);
    sectionCart.push({cart_items:cart_items});

    const get_payment_methods = 'select BankName,AccountNum from Payment_Methods where UserID = ?';
    const [Pmethods] = await mysql.promise().query(get_payment_methods,[UserID]);
    Payments.push({Pmethods:Pmethods});


    res.render('CheckOut', { 
        loggedin: loggedIn ? 'true' : 'false', 
        IS_SELLER: isSeller ? 'true' : 'false',
        sectionCart: sectionCart,
        Payments:Payments
    });

});

app.get('/Add_Payments', async (req,res)=>{
    const loggedIn = req.cookies.SignedIn === 'true';
    const isSeller = req.cookies.IS_SELLER === 'true';
    res.render('Payments', { 
        loggedin: loggedIn ? 'true' : 'false', 
        IS_SELLER: isSeller ? 'true' : 'false'
    });

});

app.get('/login',(req,res)=>{
    res.sendFile('Sign-In.html',{root:public_dir});
})

app.get('/SignUp',(req,res)=>{
    res.sendFile('Sign-Up.html',{root:public_dir});
})

app.get('/SignUpEP',(req,res)=>{
    res.sendFile('Sign-UpEP.html',{root:public_dir});
})

app.get('/login/Password',(req,res)=>{
    res.sendFile('Sign-In-Pass.html',{root:public_dir});
})

app.get('/Payments',(req,res)=>{
    res.sendFile('Payments.html',{root:public_dir});
})

app.get('/product-listing',(req,res)=>{
    res.sendFile('product-listing.html',{root:public_dir});
})

app.get('/profile-setup',(req,res)=>{

    const isSeller = req.cookies.IS_SELLER === 'true';

    res.render('profile-setup', {IS_SELLER: isSeller ? 'true' : 'false' });
})

app.get('/SellerSetup',(req,res)=>{
    res.sendFile('Seller-SignUp.html',{root:public_dir});
})

app.get('/AddProduct',(req,res)=>{
    res.sendFile('product-listing.html',{root:public_dir});
})

app.listen(port,()=>{
    console.log(`The server ${port} has been connected`);
})

app.post('/SignUpUN', (req, res) => {
    const name = req.body.UserName;
    const country = req.body.Country;
    const PHN = req.body.PHN;
    const Address = req.body.Address;

    if (!name || !country || !PHN || !Address) {
        return res.status(400).send('All fields are required');
    }

    if (PHN.length !== 11) {
        return res.status(400).send('Phone number must be 11 digits long');
    }

    const checkUsernameQuery = 'SELECT * FROM `User` WHERE UserName = ?';
    mysql.query(checkUsernameQuery, [name], (err, rows) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).send('Error checking username');
        }
        if (rows.length > 0) {
            return res.status(400).send('Username already exists');
        }

        res.cookie('username', name);
        res.cookie('country', country);
        res.cookie('PHN', PHN);
        res.cookie('Address', Address);

        res.redirect('/SignUpEP');
    });
});

app.post('/SignUp', (req, res) => {
    const username = req.cookies.username;
    const country = req.cookies.country;
    const PHN = req.cookies.PHN;
    const Address = req.cookies.Address;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.cpassword;

    res.clearCookie('username');
    res.clearCookie('country');
    res.clearCookie('PHN');
    res.clearCookie('Address');


    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,}$/;
    if (!password.match(passwordRegex)) {
        return res.status(400).send('Password must contain at least one lowercase letter, one uppercase letter, one numeric digit, one special character, and be at least 9 characters long');
    }

    const checkEmailQuery = 'SELECT * FROM `User` WHERE EMAIL = ?';
    mysql.query(checkEmailQuery, [email], (err, rows) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).send('Error checking email');
        }
        if (rows.length > 0) {
            return res.status(400).send('Email already exists');
        }

        const sql = 'INSERT INTO `User`(UserName,Country,PHN,Address,EMAIL,`PASSWORD`) VALUES (?,?,?,?,?,?)';
        mysql.query(sql, [username, country, PHN, Address, email, password], (err, result) => {
            if (err) {
                console.error('Error inserting user data:', err);
                return res.status(500).send('Error inserting user data');
            }
            console.log('User data inserted successfully');
            res.redirect('/login');
        });
    });
});

app.post('/SignInE', (req, res) => {
    const Email = req.body.email;

    const query = 'SELECT IF(COUNT(*) > 0, true, false) AS email_exists FROM `User` WHERE EMAIL = ?';
    mysql.query(query, [Email], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).send('Error checking email existence');
        }

        const emailExists = result[0]['email_exists'];
        if (emailExists === 1) {
            res.cookie('loginmail', Email);
            res.redirect('/login/Password');
        } else {
            return res.status(500).send('Email Not Registered');
            res.redirect('/login');
        }
    });
});

app.post('/SignInP', (req, res) => {
    const mail = req.cookies.loginmail;
    const password = req.body.password;
    res.clearCookie('loginmail');

    const query = 'SELECT UserID FROM `User` WHERE EMAIL = ? AND PASSWORD = ?';
    mysql.query(query, [mail, password], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).send('Error checking user existence');
        }
        if (result.length > 0) {
            const UserID = parseInt(result[0]['UserID']);
            console.log('User login success');
            res.cookie('UserId',UserID);
            res.cookie('SignedIn', 'true');

            const check_seller = 'select SellerID from Seller where UserID = (?)';
            mysql.query(check_seller,[UserID], (err,found_seller)=>{
                if(found_seller.length > 0){
                    res.cookie('IS_SELLER', 'true');
                    res.cookie('SellerID', found_seller[0].SellerID);
                }
                else{
                    res.cookie('IS_SELLER', 'false');
                }
                res.redirect('/');
            });
            
        } else {
            res.status(500).send('Password Not Correct');
        }
    });    
});

app.post('/changes', (req,res)=>{
    const name = req.body.name;
    const PHN = req.body.PHN;
    const Address = req.body.Address;
    const Country = req.body.Country;
    const UserID = req.cookies.UserId;
    const find_query = 'SELECT IF(COUNT(*) > 0, true, false) AS user_exists from `User` where UserID = (?)';
    mysql.query(find_query,[UserID],(err,result)=>{
        if(err){
            console.error('Error');
        }
        else{
            const userExistsString = result[0]['user_exists'];
            if(userExistsString === 1){
                console.log('User Found');
                const update_query = 'UPDATE `User` set UserName = (?), Country = (?), PHN = (?), Address = (?) WHERE UserID = (?)';
                mysql.query(update_query,[name,Address,PHN,Country,UserID],(err,nresult)=>{
                    if(err){
                        console.error('Error');
                    }
                    else{
                        console.error('Data Updated');
                        res.redirect('/profile-setup');
                    }
                });
            }
            else{
                console.log('User Not Found');
                res.redirect('/profile-setup');
            }
        }
    });


});

app.post('/changesP', (req, res) => {
    const oldpass = req.body.OldPassword;
    const newpass = req.body.NewPassword;
    const UserID = req.cookies.UserId;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,}$/;
    if (!newpass.match(passwordRegex)) {
        return res.status(400).send('New password must contain at least one lowercase letter, one uppercase letter, one numeric digit, one special character, and be at least 9 characters long');
    }

    const get_oldpass = 'select PASSWORD from `User` where UserID = ?';
    mysql.query(get_oldpass,[UserID],(err,password)=>{
        const pass = password[0]['PASSWORD'];
        if (oldpass === pass) {
            const find_query = 'SELECT IF(COUNT(*) > 0, true, false) AS user_exists from `User` where UserID = (?)';
            mysql.query(find_query, [UserID], (err, result) => {
                if (err) {
                    console.error('Error:', err);
                    return res.status(500).send('Error checking user credentials');
                }
    
                const userExistsString = result[0]['user_exists'];
                if (userExistsString === 1) {
                    console.log('User found');
                    const update_query = 'UPDATE `User` SET PASSWORD = ? WHERE UserID = ?';
                    mysql.query(update_query, [newpass, UserID], (err, nresult) => {
                        if (err) {
                            console.error('Error:', err);
                            return res.status(500).send('Error updating password');
                        }
                        console.log('Password updated');
                        res.redirect('/profile-setup');
                    });
                } else {
                    console.log('User not found');
                    res.redirect('/profile-setup');
                }
            });
        } else {
            console.log('Incorrect password');
            res.redirect('/profile-setup');
        }
    });


});

app.post('/logout', (req,res)=>{
    res.cookie('SignedIn','false');
    res.cookie('IS_SELLER','false');
    res.clearCookie('UserId');
    res.clearCookie('SellerID');
    res.redirect('/');
});

app.post('/SellerSignUp',(req,res)=>{
    const shopname = req.body.ShopName;
    const WareHouse = req.body.WareHouse;
    const UserID = req.cookies.UserId;

    if(!shopname || !WareHouse){
        return res.status(400).send('All fields are required');   
    }
            const enter_seller = 'INSERT INTO Seller(ShopName,UserID,warehouseAddress) values(?,?,?)';
            mysql.query(enter_seller,[shopname,UserID,WareHouse], (err,out)=>{
                if(err){
                    return res.status(400).send('ERROR2');
                }
                else{
                    res.cookie('IS_SELLER', 'true');
                    res.redirect('/');
                }
            });
});

app.post('/addproduct',upload.single('productimage'),(req,res)=>{

    const requiredFields = ['productname', 'productprice', 'productshortdescription', 'productlongdescription', 'productcategory', 'productquantity'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).send(`Missing required field: ${field}`);
        }
    }

    if (!req.file) {
        return res.status(400).send('No product image uploaded');
    }

    const UserID = parseInt(req.cookies.UserId);
    const product_image = req.file.buffer.toString('base64');
    const product_name = req.body.productname;
    const product_price = parseFloat(req.body.productprice);
    const product_short_description = req.body.productshortdescription;
    const product_long_description = req.body.productlongdescription;
    const product_category = req.body.productcategory;
    const product_quantity = req.body.productquantity;
    console.log(product_image);
    const find_sellerID = 'select SellerID from Seller where UserId = (?)';

    mysql.query(find_sellerID,[UserID],(err,ID)=>{
        const sellerID = parseInt(ID[0]['SellerID']);
        const add_product = 'INSERT INTO Products(product_img,SellerID,Name,short_Description,long_Description,Price,Category,QuantityAvailable) values(?,?,?,?,?,?,?,?)';
        mysql.query(add_product,[product_image,sellerID,product_name,product_short_description,product_long_description,product_price,product_category,product_quantity],(err,final)=>{
            if (err) {
                console.error('Error adding product:', err);
                return res.status(500).send('Error adding product');
            }

            console.log('Product added successfully');
            res.redirect('/');
        });
    });
});

app.post('/gotohome',(req,res)=>{
    res.clearCookie('PHN');
    res.clearCookie('Address');
    res.clearCookie('login-mail');
    res.clearCookie('country');
    res.clearCookie('loginpass');
    res.clearCookie('loginmail');
    res.clearCookie('name');
    res.clearCookie('username');
    res.clearCookie('search_term');
    res.clearCookie('filter_term');
    res.clearCookie('AlldetailProduct');
    res.clearCookie('PaymentSelected');
    res.clearCookie('payOption');
    res.redirect('/');
});

app.post('/addtocart',(req,res)=>{
    const pID = parseInt(req.body.productId);
    const UserID = parseInt(req.cookies.UserId);

    const check_cart = 'select quantity from Cart where ProductID = ? AND UserID = ?';

    mysql.query(check_cart,[pID,UserID],(err1,p_quantity)=>{
        if(err1){
            console.error(err1);
        }
        else{
            if(p_quantity.length < 1){
                const add_cart = 'INSERT INTO Cart(ProductID,UserID,quantity) VALUES(?,?,?)';
                mysql.query(add_cart, [pID,UserID,1], (err2,response)=>{
                    if (err2) {
                        console.error('Error adding product to cart:', err);
                    }
                    else{
                        res.redirect('/');
                    }
                });
            }
            else{
                const update_item = 'update Cart set quantity = ? where ProductID = ?';
                mysql.query(update_item,[p_quantity[0].quantity + 1,pID],(err3,response)=>{
                    if(err3){
                        console.error(err3);
                    }
                    else{
                        res.redirect('/');
                    }
                });
            }
        }
});


});

app.post('/add_favourite', (req, res) => {
    const pID = parseInt(req.body.productId);
    const UserID = parseInt(req.cookies.UserId);

    const check_favourite = 'SELECT WishListID FROM WishList_U WHERE UserID = ?';

    mysql.query(check_favourite, [UserID], (err1, userFound) => {
        if (err1) {
            console.log("Error querying user's wishlist:", err1);
            return;
        }

        const wishListID = userFound[0]?.WishListID;

        if (wishListID) {
            checkAndInsertProduct(pID, wishListID);
            
        } else {
            addNewUserAndProduct(UserID, pID);
        }
    });

    function checkAndInsertProduct(productID, wishlistID) {
        const checkProduct = 'SELECT * FROM WishList_P WHERE WishListID = ? AND ProductID = ?';

        mysql.query(checkProduct, [wishlistID, productID], (err2, result) => {
            if (err2) {
                console.log("Error querying product in wishlist:", err2);
                return;
            }

            if (result.length === 0) {
                insertProduct(productID, wishlistID);
            } else {
                console.log("Item already in favourites for this user");
            }
        });
    }

    function insertProduct(productID, wishlistID) {
        const insertItem = 'INSERT INTO WishList_P (ProductID, WishListID) VALUES (?, ?)';

        mysql.query(insertItem, [productID, wishlistID], (err3, added) => {
            if (err3) {
                console.log("Error adding product to wishlist:", err3);
            }
        });
    }

    function addNewUserAndProduct(userID, productID) {
        const addUser = 'INSERT INTO WishList_U (UserID) VALUES (?)';

        mysql.query(addUser, [userID], (err4, addedUser) => {
            if (err4) {
                console.log("Error adding user:", err4);
                return;
            }

            const newWishListID = addedUser.insertId;
            insertProduct(productID, newWishListID);
        });
    }
});

app.post('/remove_favourite', (req, res) => {
    const pID = parseInt(req.body.productId);
    const UserID = parseInt(req.cookies.UserId);

    const checkWishList = 'SELECT WishListID FROM WishList_U WHERE UserID = ?';

    mysql.query(checkWishList, [UserID], (err1, result) => {
        if (err1) {
            console.log("Error querying wishlist:", err1);
            return;
        }

        const wishListID = result[0]?.WishListID;

        if (!wishListID) {
            console.log("User's wishlist not found");
            return;
        }

        const removeProduct = 'DELETE FROM WishList_P WHERE WishListID = ? AND ProductID = ?';

        mysql.query(removeProduct, [wishListID, pID], (err2, result) => {
            if (err2) {
                console.log("Error removing product from wishlist:", err2);
                return;
            }

            const checkProducts = 'SELECT * FROM WishList_P WHERE WishListID = ?';

            mysql.query(checkProducts, [wishListID], (err3, result) => {
                if (err3) {
                    console.log("Error querying products in wishlist:", err3);
                    return;
                }

                if (result.length === 0) {
                    const removeUser = 'DELETE FROM WishList_U WHERE UserID = ?';

                    mysql.query(removeUser, [UserID], (err4, result) => {
                        if (err4) {
                            console.log("Error removing user from wishlist:", err4);
                        }
                        else{
                            res.redirect('/');
                        }
                    });
                }
            });
        });
    });
});

app.post('/removefromcart',(req,res)=>{
    const pID = parseInt(req.body.productId);
    const UserID = parseInt(req.cookies.UserId);

    const remove_cart = 'DELETE FROM Cart where ProductID = ? AND UserID = ?';

    mysql.query(remove_cart,[pID,UserID],(err,final)=>{
        if(err){
            console.error(err);
        }
        else{
            console.log("ITEM REMOVED FROM CART");
            res.redirect('/');
        }
    });
});

app.post('/filterItems',(req,res)=>{
    const search_term = req.body.SearchTerm;
    res.cookie('search_term',search_term);
    res.redirect('/search_item');
});

app.post('/further_filter',(req,res)=>{
    const filter_term = req.body.FilterTerm;
    res.cookie('filter_term',filter_term);
    res.redirect('/search_item');
});

app.post('/view_details',(req,res)=>{
    res.cookie('AlldetailProduct',req.body.productId);
    res.redirect();
});

app.post('/add_payment',(req,res)=>{
    const UID = parseInt(req.cookies.UserId);
    const cnum = req.body.cardnumber;
    const cvv = req.body.cvv; 
    const ed = req.body.expirydate;
    const cardname = req.body.cardholdername;

    const insert_payment = 'INSERT INTO Payment_Methods (BankName, AccountNum, CNN, ExpiryDate, UserID) VALUES (?, ?, ?, ?, ?)';

    mysql.query(insert_payment, [cardname, cnum, cvv, ed, UID], (err, ans) => {
        if(err){
            console.log("add_payment_error:", err);
            res.status(500).send("Error adding payment."); 
        }
        else{
            res.redirect("/"); 
        }
    });
});

app.post('/select_payment',(req,res)=>{
    // res.cookie('UserId',UserID);
    res.cookie('PaymentSelected','true');
    res.cookie('payOption',req.body.option);
    res.sendStatus(200);
})

app.post('/confirm_payment',(req,res)=>{
    const UID = parseInt(req.cookies.UserId);
    const subtotal = parseFloat(req.body.subtotal);
    let PM = parseInt(req.cookies.payOption);
    PM = (PM === 1) ? "Card" : "COD";
    const insert_orders = 'INSERT INTO ConfirmOrders(UserID,DelieveryType,total) values(?,?,?)';

    mysql.query(insert_orders,[UID,PM,subtotal],(err,output1)=>{
        if(err){
            console.log('err1');
        }
        else{
            const get_last_ID = 'SELECT ConfirmID from ConfirmOrders where UserId = ? ORDER BY ConfirmID DESC Limit 1';
            mysql.query(get_last_ID,[UID],(err2,last_inserted_ID)=>{
                const LID = parseInt(last_inserted_ID[0].ConfirmID);
                const get_cart = 'select C.CartID,C.quantity,C.ProductID from Cart as C WHERE C.UserID = ?;';
                mysql.query(get_cart,[UID],(err3,result)=>{
                    for(let i = 0; i < result.length; i++){
                        const insert_confirm_P = 'INSERT INTO ConfirmOrder_P(ProductID,ConfirmID,quantity) values(?,?,?)';
                        mysql.query(insert_confirm_P,[result[i].ProductID,LID,result[i].quantity],(err4,updaterespose)=>{
                            const delete_from_cart = 'delete from Cart where CartID = ?';
                            mysql.query(delete_from_cart,[result[i].CartID],(err6,delete_update)=>{
                                if(err6){
                                    console.log(err6);
                                    res.sendStatus(500);
                                }
                            });
                        });
                        const reduce_inventory = 'update Products set totalsales = totalsales + ?, QuantityAvailable = QuantityAvailable - ? where ProductID = ?';
                        mysql.query(reduce_inventory,[result[i].quantity,result[i].quantity,result[i].ProductID],(err4,updaterespose)=>{
                            if(err4){
                                console.log(err4);
                            }
                            else{
                                console.log('All updated');
                            }
                        });
                    }
                    res.sendStatus(200);
                });
            });
        }
    })

})

app.post('/changequantity',(req,res)=>{
    const new_quantity = req.body.newquantity;
    const PID = req.body.productId;
    console.log(new_quantity);
    const change_quantity = 'update products set QuantityAvailable = ? where ProductID = ?;';

    mysql.query(change_quantity,[new_quantity,PID],(err1,final)=>{
        if(err1){
            console.log(err1);
        }
        else{
            console.log('value updated');
        }
    });

});
