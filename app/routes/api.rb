class App
  namespace '/api/v1' do

    configure do
      mime_type :api_json, 'application/vnd.api+json'
    end

    helpers do
      def parse_request_body
        # Rack::Lint::InputWrapper doesn't respond to #size!
        # return unless request.body.respond_to?(:size) &&
        #   request.body.size > 0
        return unless request.body.read.size > 0

        halt 415 unless request.content_type &&
          request.content_type[/^[^;]+/] == mime_type(:api_json) 

        request.body.rewind
        JSON.parse(request.body.read, symbolize_names: true)
      end

      def model
        @model ||= request.path_info.gsub(/^\/api\/v1\/(\w*)(\/*.*$)/, '\1' ).singularize.classify.constantize
      end

      def serialize_models(models, options = {})
        options[:is_collection] = true
        options[:meta] = @meta
        JSONAPI::Serializer.serialize(models, options)
      end

      def serialize_model(model, options = {})
        options[:is_collection] = false
        options[:skip_collection_check] = true
        options[:meta] = @meta
        JSONAPI::Serializer.serialize(model, options)
      end

      def build_total_pages(model, page_size)
        if page_size.respond_to?(:to_i) && page_size.to_i != 0
          @meta[:total_pages] = (model.count / page_size.to_f).ceil
        else
          halt 400
        end
      end

      def error_invalid
        status 400
        { "error": "invalid_grant" }.to_json
      end

      def paginator(collection, params)
        page = params[:data_page].to_i
        page_size = params[:page_size].to_i
        # model.order(:id).extension(:pagination).paginate(page, page_size).all
        collection.paginate(page: page, per_page: page_size)
      end
      
    end

    before do
      halt 406 unless request.preferred_type.entry == mime_type(:api_json)
      @model = model unless request.path_info == "/api/v1/" # test "/" route
      @data = parse_request_body
      if request.request_method =~ /(POST|PATCH|DELETE)/
        if @data.nil? || @data.length == 0
          halt 400, { "error": "no_request_payload" }.to_json
        else
          user = User.where(username: @data[:username]).first
          halt 400, { error: "authentication_error" }.to_json if user.nil?
          if [:api_key] != @data[:api_key]
            halt 400, { error: "authentication_error" }.to_json if user.nil?
          end
        end
      end
      content_type :api_json
      @meta = {  
        copyright: "Copyright 2017 Moacir P. de Sá Pereira", 
        license: "See http://github.com/nyscapes/nywalker", 
        authors: ["Moacir P. de Sá Pereira"] 
      }
    end

  # ROOT
    get '/' do
      status 200
    end

    post '/' do
      status 200
    end

    %w(books places users instances nicknames).each do |route|

      get "/#{route}" do
        #if params[:q] # do a query
        if params[:data_page] && params[:page_size]
          build_total_pages(@model, params[:page_size])
          items = paginator(@model.all, params)
          serialize_models(items).to_json
        else
          serialize_models(@model.all).to_json
        end
      end

      get "/#{route}/:id" do
        item = @model[params[:id].to_i]
        not_found if item.nil?
        serialize_model(item).to_json
      end
      
    end

  # BOOK
  require_relative './api/book.rb'

  # NICK
  require_relative './api/nickname.rb'

  # PLACE
  require_relative './api/place.rb'
    
  # USER
  require_relative './api/user.rb'

  # INSTANCE
  require_relative './api/instance.rb'  

  # AUTH
  require_relative './api/auth.rb'

  end
end
