require "sinatra/base"
require "sinatra/assetpack"
require "mustache/sinatra"
require "googlebooks"
require "active_support" # for the slug.
require "active_support/inflector"
require "active_support/core_ext/array/conversions"

require_relative "./model"

class App < Sinatra::Base
  base = File.dirname(__FILE__)
  set :root, base

  register Sinatra::AssetPack
  register Mustache::Sinatra

  assets do
    serve "/js",    from: "app/js"
    serve "/css",   from: "app/css"
    serve "/img",   from: "app/img"

    css :app_css, [ "/css/*.css" ]
    js :app_js, [
      "/js/*.js", 
      # "/js/vendor/*.js"
    ]

  end

  require "#{base}/app/helpers"
  require "#{base}/app/views/layout"

  set :mustache, {
    :templates => "#{base}/app/templates",
    :views => "#{base}/app/views",
    :namespace => App
  }

  before do
    @user = User.first
    @css = css :app_css
    @js  = js  :app_js
    @path = request.path_info
  end

  helpers do

  end

  
  # Function allows both get / post.
  def self.get_or_post(path, opts={}, &block)
    get(path, opts, &block)
    post(path, opts, &block)
  end   

  get "/" do
    @page_title = "Home"
    mustache :index
  end

  get "/new-book" do
    @page_title = "Add New Book"
    mustache :new_book
  end

  post "/new-book" do
    @page_title = "Adding ISBN: #{params[:isbn]}"
    result = GoogleBooks.search("isbn:#{params[:isbn]}").first
    unless result.nil?
      @new_book = { author: result.authors,
                    title: result.title, 
                    year: result.published_date[0..3],
                    last_page: result.page_count,
                    cover: result.image_link,
                    link: result.info_link }
    else
      # clumsy kludge for when GoogleBooks returns a 
      @new_book = { author: "AUTHOR NOT FOUND", 
                    title: "TITLE NOT FOUND", 
                    year: "",
                    last_page: "",
                    cover: nil,
                    link: "" }
    end
    @isbn = params[:isbn] # sometimes google doesn't return one.
    mustache :new_book_post
  end

  post "/add-book" do
    @page_title = "Saving #{params[:title]}"
    saved_book = Book.new
    saved_book.attributes = { author: params[:author], title: params[:title], isbn: params[:readonlyISBN], cover: params[:cover], url: params[:link], year: params[:year], users: [@user], slug: "#{params[:title]}_#{params[:year]}".parameterize.underscore }
    begin
      saved_book.save
      redirect "/books/#{saved_book.slug}"
    rescue DataMapper::SaveFailureError => e
      mustache :error_report, locals: { e: e, validation: saved_book.errors.values.join(', ') }
    rescue StandardError => e
      mustache :error_report, locals: { e: e }
    end
  end

  get "/books/:slug" do
    @book = Book.first slug: params[:slug]
    @page_title = "#{@book.title}"
    if @book.nil?
      redirect '/books'
    else
      mustache :book_show
    end
  end

  get "/books" do
    @page_title = "All Books"
    @books = Book.all
    mustache :books_show
  end

  get "/about" do
    @page_title = "About"
    mustache :about
  end

end
