
const searchInput = document.getElementById('searchInput')
searchInput.addEventListener('input', (e)=>{
    // e.preventDefault()
    handleSearch()
})

const handleSearch = async()=>{
   try{
       const tds = document.querySelectorAll('#name')
console.log(tds)
    const result = await axios.post('http://localhost:3000/api/student/search',{
        searchInput : searchInput.value
    });
  
    const matchednames = result.data.map((s)=>{
        return s.studentname.toLowerCase()
    })

    tds.forEach((td)=>{
        let name = td.textContent;
        console.log(name)
        if(matchednames.includes(name)){
            console.log('yes matches')
            td.parentElement.style.display ="table-row"
        }else{
            td.parentElement.style.display = "none"
        }
    })

    

   }catch(err){
    console.log(err.stack)
   }
}