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
        const categories = [
            { name: 'All', query: 'SELECT * FROM Products' },
            { name: 'Best Sellers', query: 'SELECT * FROM Products ORDER BY totalsales LIMIT 4' },
            { name: 'New Releases', query: 'SELECT * FROM Products ORDER BY EntryDate LIMIT 4' },
            { name: 'Books', query: 'SELECT * FROM Products WHERE Category = "Books"' },
            { name: 'Home Garden', query: 'SELECT * FROM Products WHERE Category = "Home Garden"' },
            { name: 'PC & Video Games', query: 'SELECT * FROM Products WHERE Category = "PC & Video Games"' },
            { name: 'PC', query: 'SELECT * FROM Products WHERE Category = "PC"' },
            { name: 'Electronics', query: 'SELECT * FROM Products WHERE Category = "Electronics"' },
            { name: 'Toys & Games', query: 'SELECT * FROM Products WHERE Category = "Toys & Games"' },
            { name: 'Beauty', query: 'SELECT * FROM Products WHERE Category = "Beauty"' }
        ];

        for (const category of categories) {
            const [products] = await mysql.promise().query(category.query);
            sectionProducts.push({ section: category.name, products: products });
        }

        res.render('Index', { 
            loggedin: loggedIn ? 'true' : 'false', 
            IS_SELLER: isSeller ? 'true' : 'false', 
            sectionProducts: sectionProducts 
        });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).send('Error retrieving products');
    }
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

app.get('/Cart',(req,res)=>{
    // res.sendFile('Cart.html',{root:public_dir});
    res.render('Cart');
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


app.post('/submit', (req, res) => {
        const searchInput = req.body.searchInput;

        const sql = 'insert into search_entry (search_content) values (?)';
        mysql.query(sql, [searchInput], (err, result) => {
            if (err) throw err;
            console.log('Data inserted successfully');
            res.send('Data inserted successfully');
        });
});   

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

            const check_seller = 'select * from Seller where UserID = (?)';
            mysql.query(check_seller,[UserID], (err,found_seller)=>{
                if(found_seller.length > 0){
                    res.cookie('IS_SELLER', 'true');
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
                mysql.query(add_cart, [pID,UserID,1], (err2,res)=>{
                    if (err2) {
                        console.error('Error adding product to cart:', err);
                    }
                });
            }
            else{
                const update_item = 'update Cart set quantity = ? where ProductID = ?';
                mysql.query(update_item,[p_quantity[0].quantity + 1,pID],(err3,final)=>{
                    if(err3){
                        console.error(err3);
                    }
                })
            }
        }
});


});

// app.post('/add_favourite',(req,res)=>{
//     const pID = parseInt(req.body.productId);
//     const UserID = parseInt(req.cookies.UserId);
//     console.log(pID);
//     const check_favourite = 'select UserID,ProductID from WishList_U as U JOIN WishList_P as P ON U.WishListID = P.WishlistID WHERE UserID = ? AND ProductID = ?;';

//     mysql.query(check_favourite,[UserID,pID],(err1,returnval)=>{
//         if(err1){
//             console.log("error1");
//         }
//         else{
//             if(returnval.length < 0){
//                 console.log("Item already in favourite for this user");
//             }
//             else{
//                 const check_user = 'select WishListID from WishList_U where UserID = ?';
//                 mysql.query(check_user,[UserID],(err2,user_found)=>{
//                     if(err2){
//                         console.log(error2);
//                     }
//                     else{
//                         if(user_found.length > 0){
//                             const insert_item = 'INSERT INTO WishList_P(ProductID,WishListID)values(?,?)';
//                                 mysql.query(insert_item,[pID,user_found[0].WishListID],(err6,added)=>{
//                                     if(err6){
//                                     console.log("error6");
//                                     }
//                         });
//                         }   
//                         else{
//                             const add_user = 'INSERT INTO WishList_U(UserID)values(?)';
//                             mysql.query(add_user,[UserID],(err3,added)=>{
//                                 if(err3){
//                                     console.log("error3");
//                                 }
//                                 else{
//                                     console.log('User Added');
//                                     const get_WishID = 'select WishListID from WishList_U where UserID = ?';
//                                     mysql.query(get_WishID,[UserID],(err4,wishID)=>{
//                                         if(err4){
//                                             console.log("error4");
//                                         }
//                                         else{
//                                             const insert_item = 'INSERT INTO WishList_P(ProductID,WishListID)values(?,?)';
//                                             mysql.query(insert_item,[pID,wishID[0].WishListID],(err5,added)=>{
//                                                 if(err5){
//                                                 console.log("error5");
//                                                 }
//                                             });  
//                                         }
//                                     })
//                                 }
//                             })
//                         }
                        
//                     }
//                 });
//             }
//         }

//     });

// });

// app.post('/remove_favourite',(req,res)=>{
//     const pID = parseInt(req.body.productId);
//     const UserID = parseInt(req.cookies.UserId);
    
//     const check_favourite = 'select WishListID from WishList_U where UserID = ?';

//     mysql.query(check_favourite,[UserID],(err1,wishID)=>{
//         if(err1){
//             console.log("err1");
//         }
//         else{
//             const remove_P = 'delete from WishList_P where WishListID = ? AND ProductID = ?'
//             mysql.query(remove_P,[wishID[0].WishListID,pID],(err2,rem)=>{
//                 if(err2){
//                     console.log("err2");
//                 }
//                 else{
//                     const check_P = 'select * from WishList_P where WishListID = ?'
//                     mysql.query(check_P,[wishID[0].WishListID],(err3,rem)=>{
//                     if(err3){
//                     console.log("err3");
//                     }
//                     else{
//                         if(rem.length < 1){
//                             const remove_P = 'delete from WishList_U where UserID = ?'
//                             mysql.query(remove_P,[UserID],(err4,final)=>{
//                                 if(err4){
//                                     console.log("err4");
//                                 }
//                             });
//                         }
//                     }
//                 });
//             }
//         });
//     }
// });

// });

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
                    });
                }
            });
        });
    });
});
